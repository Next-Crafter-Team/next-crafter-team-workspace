import { v } from "convex/values";
import {
  applyClerkEvent,
  businessUserValidator,
  getCurrentUser as readCurrentUser,
  requireUser,
  toBusinessUser,
} from "@workspace/auth/server";

import { internalMutation, mutation, query } from "./_generated/server";

/**
 * The current user in the agnostic shape every other module consumes.
 * Returns null for anonymous visitors — public browsing must not require a session.
 */
export const getCurrentUser = query({
  args: {},
  returns: v.union(businessUserValidator, v.null()),
  handler: async (ctx) => {
    const user = await readCurrentUser(ctx);
    return user === null ? null : toBusinessUser(user);
  },
});

/**
 * Creates the `users` row for the signed-in Clerk identity if the webhook has
 * not landed yet, and returns it either way. The Expo wrapper calls this once
 * per sign-in so queries never observe a signed-in user without a record.
 */
export const ensureUser = mutation({
  args: {},
  returns: businessUserValidator,
  handler: async (ctx) => toBusinessUser(await requireUser(ctx)),
});

/**
 * Applies one already-verified Clerk webhook event. Internal: the only caller is
 * `http.ts`, after the svix signature check.
 *
 * `v.any()` is deliberate — the payload's shape is Clerk's to change, and
 * re-declaring it here would both break on every Clerk field addition and put a
 * Clerk type inside `convex/`, which specs/auth.md forbids.
 */
export const applyWebhookEvent = internalMutation({
  args: { payload: v.any() },
  returns: v.union(v.literal("upserted"), v.literal("anonymized"), v.literal("ignored")),
  handler: async (ctx, args) => await applyClerkEvent(ctx, args.payload),
});
