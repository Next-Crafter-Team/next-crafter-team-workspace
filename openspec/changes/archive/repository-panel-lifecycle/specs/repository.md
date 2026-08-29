# Spec: repository (MODIFIED — supersedes the baseline `openspec/specs/repository.md`)

## MODIFIED Requirement: identity and status

Adds to the baseline field list: `deletedAt: number | null` (soft delete — set, never a physical delete, so `lineage` built by others' revivals is never broken).

### Scenario: soft delete preserves lineage

- GIVEN a repository `R` that others have revived (their revive entries are in `R`'s `lineage`, and `R` appears in their own `lineage` chain)
- WHEN the owner calls `repositories.softDelete`
- THEN `R.deletedAt` MUST be set to now
- AND `R` MUST NOT be physically removed
- AND every other repository's `lineage` entry referencing `R` MUST remain intact

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

### Scenario: bury may draft an autopsy, never publishes one unreviewed

- GIVEN `repositories.bury` is called on a repository with empty `whyItDied`/`whatYouLearned`
- WHEN the implementation optionally calls an LLM to draft autopsy text
- THEN the draft MUST be stored/flagged as unreviewed (e.g. a separate `autopsyDraft` field or an explicit `reviewed: false` marker), never written directly into `whyItDied`/`whatYouLearned`
- AND the owner MUST explicitly accept or edit the draft via `repositories.update` before it counts as the real autopsy
- AND if no draft is generated, `whyItDied`/`whatYouLearned` stay empty exactly as the baseline "empty human fields" scenario requires

## Requirement: public / shared API

```ts
repositories.browsePublic({ stack?, contentType?, sortBy? }) → Array<Repository>   // public repos only
repositories.getPublicDetail({ repositoryId }) → Repository | null                 // never file contents
repositories.listMyLineage({}) → Array<{ repositoryId, entries: LineageEntry[] }>  // repos the caller buried that others later revived
repositories.importFromCandidate({ candidate }) → { repositoryId }                 // GitHub candidate → repository (unchanged from specs/flows.md)
```

## Requirement: UI state is derived, not a new persisted value

`apps/mobile` renders `latent | reminder | buried | revived` (its `GraveState`). This is a **view-layer derivation** from `status` + `visibility` + whether an active `packages/reminders` row exists for the repository — `repository.status` stays `buried | haunted | revived | undead` exactly as already specced. No new status value is introduced.

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

## Requirement: visibility stays two values

`visibility: public | private`. `public` already means "autopsia pública, código nunca expuesto" per the baseline "public autopsy hides source code" scenario — a separate `public_no_code` value would be redundant and MUST NOT be added.
