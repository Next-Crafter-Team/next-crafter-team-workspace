# Spec: user

_Baseline. Last updated by `admin-platform-panel` (archived)._

## Requirement: user is identity, not a login product

`packages/user` MUST define types for the cemetery actor. `UserId` MUST be the Convex `users` document id produced by `packages/auth` from a Clerk session — this package MUST NOT implement OAuth UI, store GitHub tokens, or store Clerk secrets itself.

A user MUST include `UserId`, `githubLogin` (optional until a GitHub App installation is connected), `displayName`, `role: "user" | "admin"` (default `"user"`), and `status: "active" | "suspended"` (default `"active"`). `role`/`status` are domain/authorization data — `packages/user` only types them; it performs no I/O and no Clerk mechanics.

### Scenario: bury attribution

- GIVEN an authenticated identity resolved via `packages/auth`
- WHEN that person buries a repository
- THEN the repository `ownerUserId` MUST equal that user's `UserId`
- AND lineage MUST record that user as the burier

### Scenario: identity source is exactly one bridge

- GIVEN `packages/user`
- WHEN an agent adds a second identity bridge (a module other than `packages/auth` that resolves a `UserId`)
- THEN that change MUST be rejected as out of scope
- AND `packages/auth` MUST remain the only source of `UserId`

### Scenario: role defaults to user

- GIVEN a new `users` row created via `packages/auth`'s sign-up sync (unchanged flow)
- WHEN it's created
- THEN `role` MUST default to `"user"` and `status` to `"active"`
- AND nothing about the sign-up flow itself changes

### Scenario: role is re-verified server-side, never trusted from the client

- GIVEN a request claims to come from an admin
- WHEN any `packages/admin` function checks authorization
- THEN it MUST re-read `role` from the `users` document via `requireAdmin(ctx)`, never accept a client-supplied role
