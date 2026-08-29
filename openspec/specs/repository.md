# Spec: repository

_Baseline. Last updated by `repository-panel-lifecycle` (archived)._

The cemetery entity is a **repository**: a GitHub-backed repo, or a manually buried entry (`packages/manual-entry`). Both share the same shape and lifecycle.

## Requirement: identity and status

A repository MUST have:

- `RepositoryId`
- `ownerUserId` (from `packages/user`)
- `origin` and `contentType` (from `packages/domain`)
- `githubFullName` (`login/repo`) — REQUIRED when `origin: github`, MUST be absent otherwise
- `status`: `buried | haunted | revived | undead`
- `visibility`: `public | private` — `public` already means "autopsy public, code never shown"; there is no third `public_no_code` value
- `title`, `whyItDied`, `whatYouLearned`
- `stack` (free-text tag, e.g. `Python`, `TypeScript`) — optional
- `reactionCount` (denormalized total across all reaction kinds; source of truth is `packages/reactions`)
- `revivalCount`
- `deletedAt: number | null` — soft delete, preserves `lineage` built by others' revivals
- `artifacts: Artifact[]` and `lineage: LineageEntry[]` (shapes defined in `packages/domain`)

### Scenario: public autopsy hides source code

- GIVEN a repository with `visibility: public` and buried status
- WHEN a visitor opens the detail screen
- THEN they MUST see autopsy fields
- AND they MUST NOT receive repository file contents until a revive/claim flow grants them

### Scenario: manually buried entry has no GitHub identity

- GIVEN a repository created from `packages/manual-entry` (`origin: manual`)
- WHEN it is persisted
- THEN `githubFullName` MUST be absent and `githubSyncedAt` MUST stay `null`
- AND every other field (status, visibility, autopsy, artifacts, lineage, reactions) MUST behave identically to a `github`-origin repository

### Scenario: soft delete preserves lineage

- GIVEN a repository `R` that others have revived (their revive entries are in `R`'s `lineage`, and `R` appears in their own `lineage` chain)
- WHEN the owner calls `repositories.softDelete`
- THEN `R.deletedAt` MUST be set to now
- AND `R` MUST NOT be physically removed
- AND every other repository's `lineage` entry referencing `R` MUST remain intact

## Requirement: two clocks

A repository MUST store two timestamps and MUST NOT collapse them:

| Field | Updates when |
| --- | --- |
| `statusUpdatedAt` | cemetery status changes (bury / haunt / revive) |
| `githubSyncedAt` | GitHub candidate data is pulled — `origin: github` only, stays `null` otherwise |

### Scenario: sync without status change

- GIVEN a buried repository with `origin: github`
- WHEN GitHub sync runs and status stays `buried`
- THEN `githubSyncedAt` MUST change
- AND `statusUpdatedAt` MUST stay unchanged

### Scenario: revive

- GIVEN a buried repository, any origin
- WHEN a user revives it
- THEN `status` MUST become `revived` or `undead` if `revivalCount` was already greater than zero
- AND `statusUpdatedAt` MUST change
- AND `revivalCount` MUST increment
- AND `lineage` MUST append a `LineageEntry` for the reviver from `packages/user`
- AND `packages/notifications` MUST be told to notify the prior owner

## Requirement: owner-facing panel API (Panel 1 — "Mi Cementerio")

All of the following MUST require `requireOwner(ctx, repositoryId)` (or `requireUser(ctx)` for the listing), scoped to `ownerUserId == currentUser._id`, verified server-side:

```ts
repositories.listMine({ status?, visibility?, includeDeleted? })
  → Array<Repository>   // excludes deletedAt != null unless includeDeleted: true

repositories.update({ repositoryId, whyItDied?, whatYouLearned?, visibility? })
  → { ok: boolean }      // MUST NOT invent text if a field is cleared — stays empty

repositories.softDelete({ repositoryId }) → { ok: boolean }

repositories.bury({ repositoryId }) → { ok: boolean }
  // transitions a latent/haunted repository to buried + visibility: public
```

### Scenario: reminders view / owner can always find what they buried

- GIVEN a signed-in user with 2 public and 3 private repositories they own
- WHEN they call `repositories.listMine` (not the public browse/detail queries)
- THEN Convex MUST return all 5
- AND a different, non-owner user requesting the same listing for that `ownerUserId` MUST only see the public ones

### Scenario: bury may draft an autopsy, never publishes one unreviewed

- GIVEN `repositories.bury` is called on a repository with empty `whyItDied`/`whatYouLearned`
- WHEN the implementation optionally calls an LLM to draft autopsy text
- THEN the draft MUST be stored/flagged as unreviewed (e.g. a separate `autopsyDraft` field or an explicit `reviewed: false` marker), never written directly into `whyItDied`/`whatYouLearned`
- AND the owner MUST explicitly accept or edit the draft via `repositories.update` before it counts as the real autopsy
- AND if no draft is generated, `whyItDied`/`whatYouLearned` stay empty exactly as the "empty human fields" scenario requires

## Requirement: public / shared API

```ts
repositories.browsePublic({ stack?, contentType?, sortBy? }) → Array<Repository>   // public repos only
repositories.getPublicDetail({ repositoryId }) → Repository | null                 // never file contents
repositories.listMyLineage({}) → Array<{ repositoryId, entries: LineageEntry[] }>  // repos the caller buried that others later revived
repositories.importFromCandidate({ candidate }) → { repositoryId }                 // GitHub candidate → repository
```

## Requirement: UI state is derived, not a new persisted value

`apps/mobile` renders `latent | reminder | buried | revived` (its `GraveState`). This is a **view-layer derivation** from `status` + `visibility` + whether an active `packages/reminders` row exists for the repository — `status` itself stays `buried | haunted | revived | undead`. No new status value is introduced.

| `GraveState` (frontend) | Derived from |
| --- | --- |
| `latent` | `status: buried`, `visibility: private`, no active reminder |
| `reminder` | `status: haunted` (has an active `packages/reminders` row) |
| `buried` | `status: buried`, `visibility: public` |
| `revived` | `status: revived` or `undead` (`revivalCount` distinguishes them client-side if needed) |

### Scenario: haunted always means an active reminder exists

- GIVEN `repository.status === "haunted"`
- WHEN `apps/mobile` renders it
- THEN there MUST be a corresponding active row in `packages/reminders` for that `repositoryId`
- AND if `packages/reminders` closes that row (via `respond`), `convex` MUST also transition `status` back to `buried` — a repository MUST NOT stay `haunted` with no active reminder

## Requirement: detail screen fields

The visual contract is `apps/mobile/conceptual/Publica.html` (superseding the earlier `apps/mobile/mocks/repository-detail.html`, which is the same screen). Runtime UI MAY be Expo, not that HTML file. The screen MUST be able to show: breadcrumb/category, status pill, origin pill (GitHub or manual), title, `githubFullName` when present, `stack` when present, buried age from `statusUpdatedAt`, reaction counts by kind, revival count, why it died, what was learned, the `artifacts` list (each rendered per its `kind`), `lineage` (who/what/when per entry), reaction buttons, revive CTA.

### Scenario: empty human fields

- GIVEN a GitHub candidate just imported, or a manual entry just drafted
- WHEN detail is shown before the owner writes the autopsy
- THEN `whyItDied` and `whatYouLearned` MUST be empty
- AND the UI MUST NOT invent autopsy text
