# Spec: admin platform panel

_Baseline. Added by `admin-platform-panel` (archived). Does not modify `packages/auth` or `packages/github`._

## Requirement: every admin function re-verifies role server-side

`packages/admin` MUST expose (or `convex` MUST implement, composing this module's types) a `requireAdmin(ctx)` helper that calls the existing `requireUser(ctx)` from `packages/auth` unchanged, then checks `user.role === "admin"` from `packages/user`'s field, throwing if not. No admin function MUST trust a client-supplied role.

### Scenario: non-admin is rejected

- GIVEN a signed-in user with `role: "user"`
- WHEN they call any `admin.*` function
- THEN it MUST throw before touching any admin data

## Requirement: metrics dashboard reads pre-aggregated data

```ts
admin.metrics({ from?, to?, granularity?: "day" | "week" })
  → {
      totals: { buried, revived, activeUsers, resurrectionRate },
      series: Array<{ date, buried, revived, activeUsers, resurrectionRate }>
    }
```

### Scenario: dashboard does not scan the whole table

- GIVEN `admin.metrics` is called
- WHEN it runs
- THEN it MUST read from a pre-aggregated `metrics_daily` table
- AND MUST NOT scan every `repository`/`user` document on every load

## Requirement: moderation queue

```ts
reports.create({ repositoryId, reason }) → { id }          // any authenticated user, idempotent per (repositoryId, reporterId)
admin.reports.list({ status? }) → Array<Report>             // admin only
admin.reports.resolve({ reportId, action: "approve" | "hide" | "delete", note? }) → { ok }
```

### Scenario: duplicate reports don't pile up

- GIVEN a user already reported repository `R`
- WHEN they call `reports.create` on `R` again
- THEN the existing report row MUST be reused (idempotent by `(repositoryId, reporterId)`), not duplicated

### Scenario: resolve actions have distinct, defined effects

- GIVEN a pending report on `R`
- WHEN an admin resolves with `hide`
- THEN `R.visibility` MUST become `private` and it MUST drop out of public browse
- AND WHEN resolved with `delete`, `R.deletedAt` MUST be set (soft delete, per `specs/repository.md`) — never a physical delete
- AND `approve` MUST leave `R` untouched and only close the report

## Requirement: system health is observable

```ts
admin.system.health({})
  → {
      cron: { lastRun, recentRuns },
      github: { activeInstallations, recentOAuthErrors },
      api: { recentErrorCount, p95LatencyMs }
    }
```

This reads `job_runs` (written by the `reminders`/metrics crons in `convex`) and `github_installations` (owned by `packages/github`, read-only here — this module MUST NOT write to that table).

## Requirement: user management

```ts
admin.users.list({ page? }) → Array<{ userId, role, status, ideaCount, revivedCount, lastActiveAt }>
admin.users.update({ userId, role?, status? }) → { ok }
```

### Scenario: last admin cannot self-demote

- GIVEN exactly one user has `role: "admin"`
- WHEN that admin calls `admin.users.update({ userId: themselves, role: "user" })`
- THEN it MUST be rejected

### Scenario: role change does not yet propagate to the Clerk JWT

- GIVEN `admin.users.update` changes a user's `role`
- WHEN that user's next Convex call happens before their Clerk session refreshes
- THEN `requireAdmin` MUST still work correctly because it reads `role` from the `users` document, not the JWT
- AND syncing the change into Clerk's public metadata (so the JWT itself reflects it sooner) is explicitly out of scope for this module — tracked as a dependency on whoever owns `packages/auth`

## Forbidden imports

`apps/**`. MUST NOT import `packages/auth` internals (only the unchanged `requireUser` it already exports) or `packages/github` internals (only reads `github_installations` via a `convex` query, never GitHub App secrets).
