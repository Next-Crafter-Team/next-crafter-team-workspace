# Spec: module layout

_Baseline. Last updated by `module-contracts-add-panel-modules` (archived)._

## Requirement: named MVP modules

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

YouTube, Luma, Zernio, TikTok, Instagram, and LinkedIn connectors (live API integrations) MUST NOT be added without a dedicated change — hand-typed content via `manual-entry` is not an exception to this. No identity provider other than Clerk (via `packages/auth`) MUST be added.

### Scenario: teammate opens a module

- GIVEN a clone at baseline
- WHEN they open one of the module folders
- THEN they MUST find `CONTRACT.md` covering purpose, in/out of scope, public API, auth, failure modes, and forbidden imports

## Requirement: dependency direction

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

`packages/reactions`, `packages/notifications`, `packages/reminders`, `packages/saved-ideas`, and `packages/admin` MUST NOT import each other or `packages/github`/`packages/auth` internals — only `convex` composes all of them. `convex` owns two crons: `process-reminders` (drives `packages/reminders`) and a metrics-aggregation job that writes `metrics_daily` for `packages/admin`. Both write to `job_runs`, which `admin.system.health` reads.

### Scenario: admin reads github_installations without owning it

- GIVEN `packages/admin` needs `activeInstallations` for system health
- WHEN it's implemented
- THEN it MUST read `github_installations` via a `convex` query
- AND MUST NOT import `packages/github` or touch GitHub App secrets/tokens

### Scenario: forbidden import

- GIVEN an agent implementing `apps/mobile`
- WHEN a feature seems to need a GitHub token or a Clerk hook
- THEN the agent MUST NOT import `packages/github` or Clerk SDK types
- AND MUST call a Convex query/mutation, or `useBusinessAuth()`, instead

### Scenario: evidence upload stays in convex

- GIVEN `packages/manual-entry` needs to accept a file
- WHEN an agent implements the upload
- THEN the actual file bytes MUST go through a Convex file-storage action (`convex/CONTRACT.md`)
- AND `packages/manual-entry` MUST only ever handle the resulting `Artifact` reference, never raw file data

## Requirement: one spec file, one owner — collaborative edits MUST NOT collide in git

Modules are implemented by different people in parallel. The folder-per-module layout above already isolates code (`packages/<name>/`, `apps/mobile/`, `convex/`) so two people editing different modules never touch the same file. This requirement extends that isolation to specs and process.

- A person working on module `X` MUST only edit `packages/X/CONTRACT.md` (or `convex/CONTRACT.md` / `apps/mobile/CONTRACT.md` for those two) and that module's own spec delta file (`specs/X.md`) inside their own change folder.
- A spec or behavior change to a single module MUST live in its own `openspec/changes/<module>-<short-slug>/` folder, scoped to that module's files only. It MUST NOT be bundled into another module's change folder.
- Cross-cutting files — this module table/dependency diagram, and `specs/flows.md` — MUST be edited through their own small, fast-merged change, not as a side effect of one module's feature work.
- `openspec/specs/` is the merged baseline. Once a module's change is done, archive it into `openspec/changes/archive/<change-id>/` and fold its accepted deltas into the matching file here.

### Scenario: two modules in flight at once

- GIVEN person A opens `openspec/changes/github-app-repo-picker/` for `packages/github`
- AND person B opens `openspec/changes/reactions-add-kind/` for `packages/reactions`
- WHEN both push to `main` around the same time
- THEN their diffs MUST NOT touch any of the same files
- AND neither branch requires a rebase against the other to merge cleanly

### Scenario: forbidden cross-module edit

- GIVEN an agent or teammate is implementing `packages/manual-entry`
- WHEN they are tempted to also edit `packages/reactions/CONTRACT.md` "to make it consistent"
- THEN they MUST NOT — they open a note/issue for the `reactions` owner instead, or a separate small change if it is genuinely their call to make
