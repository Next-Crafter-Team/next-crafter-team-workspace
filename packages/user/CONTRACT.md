# Contract: `packages/user`

User identity for the cemetery. Domain types only — session/auth is `packages/auth`'s job, not this module's.

## In scope

- Types: `UserId` (= Convex `users` document id), `githubLogin`, `displayName`, `role: "user" | "admin"` (default `"user"`), `status: "active" | "suspended"` (default `"active"`)
- Owner of a `repository` (who buried it)
- Actor on lineage (bury / revive)
- `UserId` MUST come from `packages/auth` (Clerk-backed); this package MUST NOT implement login itself
- `role`/`status` are domain/authorization data only — this package types them; `convex`/`packages/admin` read and write them, re-verified server-side every time (never trusted from a client)

## Out of scope

- Clerk SDK/session/webhook handling directly (that is `packages/auth`) — this includes syncing `role` to Clerk's public metadata, which is `packages/auth`'s to implement, not this module's
- A second identity bridge of any kind — see `openspec/specs/auth.md`
- Reactions, autopsies, GitHub API

## Public API

TypeScript types only. Persistence lives in `convex/`.

## Forbidden imports

`apps/**`, `packages/github`, Clerk SDK types. MAY be imported by `packages/domain` and `convex`. `packages/auth` produces the `UserId` this module types — `packages/user` does not import `packages/auth` back.
