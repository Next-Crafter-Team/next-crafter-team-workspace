/**
 * Convex side of `packages/auth`.
 *
 * This is the ONLY place in the repository that knows about Clerk on the
 * server: the `users` table shape, the identity bridge, and the webhook
 * signature check all live here. `convex/` registers thin Convex functions on
 * top of these helpers; no other package imports Clerk types.
 *
 * Contains no React Native / Expo import, by contract (`convex/CONTRACT.md`).
 */
import type { UserJSON, WebhookEvent } from "@clerk/backend";
import {
  defineSchema,
  defineTable,
  type DataModelFromSchemaDefinition,
  type GenericMutationCtx,
  type GenericQueryCtx,
} from "convex/server";
import { ConvexError, v } from "convex/values";
import { Webhook } from "svix";

import { AuthErrorCode, type AuthErrorData, type BusinessUser } from "./types";

/**
 * The `users` table. `convex/schema.ts` spreads this in rather than redeclaring
 * it, so the domain user shape has exactly one definition.
 */
export const usersTable = defineTable({
  clerkId: v.string(),
  email: v.string(),
  name: v.union(v.string(), v.null()),
  imageUrl: v.union(v.string(), v.null()),
  /** Set when Clerk reports the account deleted. The row itself is kept — see `deleteFromClerk`. */
  deletedAt: v.optional(v.number()),
}).index("by_clerkId", ["clerkId"]);

const authSchema = defineSchema({ users: usersTable });

type AuthDataModel = DataModelFromSchemaDefinition<typeof authSchema>;
type AuthQueryCtx = GenericQueryCtx<AuthDataModel>;
type AuthMutationCtx = GenericMutationCtx<AuthDataModel>;

export type UserDoc = AuthDataModel["users"]["document"];

/** Validator for the agnostic shape public Convex queries return. */
export const businessUserValidator = v.object({
  id: v.id("users"),
  email: v.string(),
  name: v.union(v.string(), v.null()),
  imageUrl: v.union(v.string(), v.null()),
});

export function toBusinessUser(doc: UserDoc) {
  return { id: doc._id, email: doc.email, name: doc.name, imageUrl: doc.imageUrl } satisfies BusinessUser;
}

function authError(code: AuthErrorData["code"], message: string): ConvexError<AuthErrorData> {
  return new ConvexError({ code, message });
}

async function findByClerkId(ctx: AuthQueryCtx, clerkId: string): Promise<UserDoc | null> {
  return await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
    .unique();
}

/**
 * The current user, or `null` when nobody is signed in or the row has not been
 * created yet. Never throws, never writes — safe in any query, including the
 * anonymous public-browsing paths in `specs/convex-and-mobile.md`.
 */
export async function getCurrentUser(ctx: AuthQueryCtx): Promise<UserDoc | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) return null;
  return await findByClerkId(ctx, identity.subject);
}

/**
 * The current user, or a throw. Every write path in every module goes through
 * this — it is what `packages/user`'s `UserId` ultimately resolves to.
 *
 * In a mutation the row is created lazily when the Clerk webhook has not landed
 * yet. In a query, which cannot write, a missing row throws `USER_NOT_SYNCED`
 * instead: handing back a document without a real `_id` would let a caller
 * write it into `repository.ownerUserId`. The client wrapper runs `ensureUser`
 * on sign-in, so a query hitting this in practice means the session is stale.
 */
export async function requireUser(ctx: AuthQueryCtx | AuthMutationCtx): Promise<UserDoc> {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    throw authError(AuthErrorCode.NotSignedIn, "No valid session. Sign in and retry.");
  }

  const existing = await findByClerkId(ctx, identity.subject);
  if (existing !== null) return existing;

  if (!canWrite(ctx)) {
    throw authError(
      AuthErrorCode.UserNotSynced,
      "Signed in, but no user record yet. Run the ensureUser mutation first.",
    );
  }

  // Lazy sync. Mutations are serializable, so this cannot race the webhook into
  // a duplicate row: whichever transaction commits second reads the first one's
  // write and returns above.
  const id = await ctx.db.insert("users", {
    clerkId: identity.subject,
    email: identity.email ?? "",
    name: identity.name ?? null,
    imageUrl: identity.pictureUrl ?? null,
  });

  const created = await ctx.db.get(id);
  if (created === null) {
    throw authError(AuthErrorCode.UserNotSynced, "Failed to create the user record.");
  }
  return created;
}

function canWrite(ctx: AuthQueryCtx | AuthMutationCtx): ctx is AuthMutationCtx {
  return "insert" in ctx.db;
}

/**
 * A svix-verified Clerk webhook body.
 *
 * Deliberately opaque: `convex/` routes one of these from `http.ts` to
 * `applyClerkEvent` without ever naming a Clerk type, which is what
 * `specs/auth.md` means by "no module outside `packages/auth` references Clerk
 * webhook payloads directly".
 */
export type ClerkWebhookPayload = Record<string, unknown>;

/** What `applyClerkEvent` did, for the caller to log without inspecting Clerk data. */
export type ClerkEventOutcome = "upserted" | "anonymized" | "ignored";

/**
 * Applies a verified Clerk webhook event to the `users` table.
 *
 * The payload is only trustworthy because `verifyClerkWebhook` checked its
 * signature first; this function assumes that already happened.
 */
export async function applyClerkEvent(
  ctx: AuthMutationCtx,
  payload: ClerkWebhookPayload,
): Promise<ClerkEventOutcome> {
  const event = payload as unknown as WebhookEvent;
  switch (event.type) {
    case "user.created":
    case "user.updated":
      await upsertFromClerk(ctx, event.data);
      return "upserted";
    case "user.deleted": {
      const clerkId = event.data.id;
      if (clerkId === undefined) return "ignored";
      await deleteFromClerk(ctx, clerkId);
      return "anonymized";
    }
    default:
      return "ignored";
  }
}

/** Applies a Clerk `user.created` / `user.updated` payload to the `users` table. */
async function upsertFromClerk(ctx: AuthMutationCtx, data: UserJSON): Promise<void> {
  const attrs = {
    clerkId: data.id,
    email: primaryEmail(data),
    name: fullName(data),
    imageUrl: data.image_url ?? null,
  };

  const existing = await findByClerkId(ctx, data.id);
  if (existing === null) {
    await ctx.db.insert("users", attrs);
    return;
  }
  // An update after a delete revives the row: `deletedAt` is cleared.
  await ctx.db.patch(existing._id, { ...attrs, deletedAt: undefined });
}

/**
 * Handles a Clerk `user.deleted` webhook by ANONYMIZING, not deleting.
 *
 * `openspec/specs/flows.md` requires this choice be explicit: repositories that
 * user buried keep a valid `ownerUserId`, and lineage stays readable. Only the
 * personal fields go.
 */
async function deleteFromClerk(ctx: AuthMutationCtx, clerkId: string): Promise<void> {
  const existing = await findByClerkId(ctx, clerkId);
  if (existing === null) return;
  await ctx.db.patch(existing._id, {
    email: "",
    name: null,
    imageUrl: null,
    deletedAt: Date.now(),
  });
}

/**
 * Verifies the svix signature on a Clerk webhook request.
 *
 * Returns `null` on any failure — the caller MUST answer 4xx, never 200, or
 * Clerk will consider a forged delivery accepted.
 */
export async function verifyClerkWebhook(
  request: Request,
  secret: string,
): Promise<ClerkWebhookPayload | null> {
  const payload = await request.text();
  const headers = {
    "svix-id": request.headers.get("svix-id") ?? "",
    "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
    "svix-signature": request.headers.get("svix-signature") ?? "",
  };

  try {
    return new Webhook(secret).verify(payload, headers) as ClerkWebhookPayload;
  } catch {
    return null;
  }
}

function primaryEmail(data: UserJSON): string {
  const primary = data.email_addresses.find((e) => e.id === data.primary_email_address_id);
  return primary?.email_address ?? data.email_addresses[0]?.email_address ?? "";
}

function fullName(data: UserJSON): string | null {
  const name = [data.first_name, data.last_name].filter(Boolean).join(" ").trim();
  return name.length > 0 ? name : null;
}
