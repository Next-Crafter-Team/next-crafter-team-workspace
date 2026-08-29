# Proposal: admin platform panel (Panel 2)

## Why

`docs/backend/endpoints.md` specs a second, transversal panel — metrics, moderation/reports, system health, user management — gated by `role: "admin"`, which does not exist anywhere yet. The doc itself calls this out as needing its own change, not bolted onto another module's work.

## Explicit boundary: does not touch Clerk or GitHub

Per instruction, this change does **not** modify `packages/auth` or `packages/github` — other teams own those. Concretely:

- `role`/`status` are added to `packages/user` (a domain-data field, not a Clerk session concern) — `packages/user`'s existing "domain types only" boundary already covers this.
- `requireAdmin(ctx)` is implemented by **composing** the existing, unchanged `requireUser(ctx)` from `packages/auth` with a role check against `packages/user`'s new field. `packages/auth`'s public API, contract, and spec are not edited.
- Syncing `role` to Clerk's public metadata (so the JWT reflects it) is a real requirement from the endpoints doc, but it requires calling Clerk's Backend API — squarely inside `packages/auth`'s boundary ("the only module that imports Clerk SDK types"). This change does **not** implement that sync. It's recorded as an explicit dependency for whoever owns `packages/auth` to pick up; until then, `requireAdmin` reads `role` from the Convex `users` row directly (already always available via `requireUser`), not from the JWT, so the admin panel works correctly without needing that sync yet.

## In scope

- New module `packages/admin`: metrics read model, reports (create + moderate), system health read model, user role/status management
- `packages/user` gains `role: "user" | "admin"` (default `"user"`) and `status: "active" | "suspended"` (default `"active"`)
- New tables: `reports`, `job_runs`, `metrics_daily` (data model only — the cron/aggregation job that writes `job_runs`/`metrics_daily` is `convex`'s to implement, same pattern as `reminders`)

## Out of scope

- The Clerk-metadata role sync (see above — flagged, not implemented)
- The actual metrics-aggregation cron logic (data shape only, per `specs/module-contracts.md`'s convex/module split)
- Any UI beyond what `apps/mobile/src/app/admin/` already mocks

## Success

A user with `role: "admin"` can see global metrics, resolve reports, check cron/GitHub/API health, and manage user roles — all server-verified, never trusting the client — without this change touching a single line the auth or GitHub teams own.
