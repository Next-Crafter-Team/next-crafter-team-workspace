import { defineSchema } from "convex/server";
import { usersTable } from "@workspace/auth/server";

// The `users` table is defined by packages/auth, the only module allowed to
// know how a Clerk identity maps to a domain user. Other modules add their own
// tables here and reference `v.id("users")`.
export default defineSchema({
  users: usersTable,
});
