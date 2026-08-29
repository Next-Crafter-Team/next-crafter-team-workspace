# Spec: module layout (MODIFIED — supersedes the baseline `openspec/specs/module-contracts.md`)

## MODIFIED Requirement: named MVP modules

The MVP MUST use these folders, each with `CONTRACT.md`:

| Name | Folder |
| --- | --- |
| convex | `convex/` |
| mobile | `apps/mobile/` |
| domain | `packages/domain/` |
| auth | `packages/auth/` |
| github | `packages/github/` |
| user | `packages/user/` |
| repository | `packages/repository/` |
| manual-entry | `packages/manual-entry/` |
| reactions | `packages/reactions/` |
| notifications | `packages/notifications/` |
| reminders | `packages/reminders/` |
| saved-ideas | `packages/saved-ideas/` |
| admin | `packages/admin/` |

## MODIFIED Requirement: dependency direction

```text
apps/mobile        → convex
apps/mobile        → packages/auth        (session wrapper + provider mount)
convex              → packages/auth
convex              → packages/github
convex              → packages/manual-entry → packages/domain
convex              → packages/reactions    → packages/repository, packages/user (types only)
convex              → packages/notifications → packages/repository, packages/user (types only)
convex              → packages/reminders    → packages/repository, packages/user (types only)
convex              → packages/saved-ideas  → packages/repository, packages/user (types only)
convex              → packages/admin        → packages/user (role/status), packages/repository (types only), packages/github (read-only, github_installations)
convex              → packages/repository → packages/user
convex              → packages/domain
packages/auth       → packages/user
```

`convex` owns two crons: `process-reminders` (drives `packages/reminders`) and a metrics-aggregation job that writes `metrics_daily` for `packages/admin`. Both write to `job_runs`, which `admin.system.health` reads.

### Scenario: admin reads github_installations without owning it

- GIVEN `packages/admin` needs `activeInstallations` for system health
- WHEN it's implemented
- THEN it MUST read `github_installations` via a `convex` query
- AND MUST NOT import `packages/github` or touch GitHub App secrets/tokens
