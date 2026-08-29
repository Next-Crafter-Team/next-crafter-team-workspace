/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";

import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

const CLERK_ID = "user_clerk_123";

function clerkUserPayload(type: "user.created" | "user.updated") {
  return {
    type,
    data: {
      id: CLERK_ID,
      primary_email_address_id: "idn_1",
      email_addresses: [{ id: "idn_1", email_address: "vera@example.com" }],
      first_name: "Vera",
      last_name: "Rubin",
      image_url: "https://img.example.com/vera.png",
    },
  };
}

describe("clerk identity bridge", () => {
  test("lazy sync and the webhook converge on a single row", async () => {
    const t = convexTest(schema, modules);
    const signedIn = t.withIdentity({ subject: CLERK_ID, email: "vera@example.com" });

    // The app reaches Convex before Clerk's webhook does.
    const lazy = await signedIn.mutation(api.auth.ensureUser, {});

    // The webhook lands afterwards with the fuller Clerk profile.
    await t.mutation(internal.auth.applyWebhookEvent, { payload: clerkUserPayload("user.created") });

    const rows = await t.run(async (ctx) => await ctx.db.query("users").collect());
    expect(rows).toHaveLength(1);
    expect(rows[0]?._id).toBe(lazy.id);
    expect(rows[0]?.name).toBe("Vera Rubin");
  });

  test("user.deleted anonymizes the row instead of removing it", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.auth.applyWebhookEvent, { payload: clerkUserPayload("user.created") });

    await t.mutation(internal.auth.applyWebhookEvent, {
      payload: { type: "user.deleted", data: { id: CLERK_ID } },
    });

    const rows = await t.run(async (ctx) => await ctx.db.query("users").collect());
    expect(rows).toHaveLength(1);
    expect(rows[0]?.email).toBe("");
    expect(rows[0]?.deletedAt).toEqual(expect.any(Number));
  });

  test("an anonymous visitor gets null, not an error", async () => {
    const t = convexTest(schema, modules);
    await expect(t.query(api.auth.getCurrentUser, {})).resolves.toBeNull();
  });

  test("ensureUser refuses a request with no session", async () => {
    const t = convexTest(schema, modules);
    await expect(t.mutation(api.auth.ensureUser, {})).rejects.toThrow(/NOT_SIGNED_IN/);
  });
});
