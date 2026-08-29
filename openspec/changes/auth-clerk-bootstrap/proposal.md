# Proposal: bootstrap Clerk authentication

## Why

`openspec/specs/auth.md` has required Clerk as the sole identity provider since
`business-auth-github-app` was archived, but no code implemented it: `convex/`,
`apps/mobile/` and `packages/auth/` each held only a `CONTRACT.md`. Task `2.1`
of that archived change ("register a real Clerk app, scaffold Convex/Expo") is
the only item it left unchecked, and every other module is blocked on it —
`packages/repository` cannot record an owner, `packages/github` cannot link an
installation to a user, and `apps/mobile` cannot gate writing an autopsy.

## What changes

`packages/auth` becomes a real workspace package that other modules import.
`convex/` gains the JWT validation, the `users` table, and the Clerk webhook.
`apps/mobile` becomes an Expo app that mounts the wrapper.

No behavior in `openspec/specs/` changes — this change implements requirements
that already exist. It carries no `specs/` delta for that reason.

## Cross-module scope

`CONTRIBUTING.md` asks for one change folder per module. This change
deliberately spans `packages/auth`, `convex/` and `apps/mobile` instead:

- `convex/` and `apps/mobile` both depend on `packages/auth` existing first, so
  three change folders would run strictly sequentially and buy none of the
  parallelism the rule protects.
- Nothing else was in flight — the repository had no application source at all,
  so no other branch could conflict with this one.
- `specs/module-contracts.md` already grants this: whoever bootstraps a module
  owns that cross-cutting change and keeps it short-lived.

It is delivered as three chained commits in dependency order to stay within
`review_budget_lines: 400` per reviewable slice.

## Out of scope

GitHub App installation (`packages/github`), roles and permissions, billing,
`repository` / `domain` / `user` implementation, and any UI beyond one screen
that proves the identity chain works.

## Rollback

Revert the three commits. Nothing outside `packages/auth`, `convex/`,
`apps/mobile` and the root workspace manifest is touched, and no data migration
runs — the `users` table is new.
