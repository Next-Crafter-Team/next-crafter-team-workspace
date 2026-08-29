# Spec: user (MODIFIED — supersedes the baseline `openspec/specs/user.md`)

## MODIFIED Requirement: user is identity, not a login product

Adds to the baseline field list: `role: "user" | "admin"` (default `"user"`), `status: "active" | "suspended"` (default `"active"`). These are domain/authorization data on the user record — `packages/user` still MUST NOT implement any Clerk/session mechanics; `role`/`status` are read and written by `convex` and `packages/admin`, never by `packages/user` performing I/O itself (it only types the fields).

### Scenario: role defaults to user

- GIVEN a new `users` row created via `packages/auth`'s sign-up sync (unchanged flow)
- WHEN it's created
- THEN `role` MUST default to `"user"` and `status` to `"active"`
- AND nothing about the sign-up flow itself changes

### Scenario: role is re-verified server-side, never trusted from the client

- GIVEN a request claims to come from an admin
- WHEN any `packages/admin` function checks authorization
- THEN it MUST re-read `role` from the `users` document via `requireAdmin(ctx)`, never accept a client-supplied role
