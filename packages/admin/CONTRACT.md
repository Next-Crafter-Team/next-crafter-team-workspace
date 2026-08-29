# Contract: `packages/admin`

Panel 2 — platform admin: metrics, moderation, system health, user management. Gated by `role: "admin"` on `packages/user`.

**Does not touch Clerk or GitHub.** `requireAdmin(ctx)` composes the existing, unchanged `requireUser(ctx)` from `packages/auth` with a role check — `packages/auth`'s contract/spec are not edited by this module. Syncing `role` to Clerk's public metadata is explicitly out of scope here and tracked as a dependency on whoever owns `packages/auth`; until that lands, `requireAdmin` reads `role` from the Convex `users` row (always current) rather than the JWT, so nothing here is blocked by it.

## In scope

- `requireAdmin(ctx)` helper
- Metrics dashboard, reading pre-aggregated `metrics_daily`
- Moderation queue: `reports` (create by any user, list/resolve by admin only)
- System health read model (`job_runs`, and a read-only view of `github_installations`)
- User management: list users, update `role`/`status`

## Out of scope

- The metrics-aggregation cron logic itself (data shape only — `convex/` implements the job)
- Syncing `role` to Clerk (see above)
- Writing to `github_installations` — read-only

## Public API

```ts
admin.metrics({ from?, to?, granularity? }) → { totals, series }
reports.create({ repositoryId, reason }) → { id }
admin.reports.list({ status? }) → Array<Report>
admin.reports.resolve({ reportId, action: "approve" | "hide" | "delete", note? }) → { ok }
admin.system.health({}) → { cron, github, api }
admin.users.list({ page? }) → Array<UserSummary>
admin.users.update({ userId, role?, status? }) → { ok }
```

## Auth

Every function except `reports.create` (any authenticated user) MUST use `requireAdmin(ctx)`, re-verifying role server-side every call.

## Failure modes

`reports.create` MUST be idempotent per `(repositoryId, reporterId)`. `admin.users.update` MUST reject demoting the last remaining admin.

## Forbidden imports

`apps/**`. MUST NOT import `packages/auth` internals beyond the existing `requireUser` export, or `packages/github` internals — reads `github_installations` via a `convex` query only.
