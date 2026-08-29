# Contract: `packages/repository`

Cemetery entity: GitHub-backed **or** manually buried (`packages/manual-entry`). Source of the idea-detail screen.

## In scope

- Identity: `RepositoryId`, `ownerUserId`, `origin`/`contentType` (from `packages/domain`), `githubFullName` (`login/repo`) — required only when `origin: github`
- Cemetery status: `buried | haunted | revived | undead`
- Visibility: `public | private`
- Autopsy fields: `title`, `whyItDied`, `whatYouLearned`, `stack` (optional), `artifacts: Artifact[]`, `lineage: LineageEntry[]` (shapes in `packages/domain`)
- **State clocks (required):**
  - `statusUpdatedAt` — last time cemetery status changed (bury / haunt / revive)
  - `githubSyncedAt` — last time GitHub candidate state was pulled; stays `null` for `origin: manual`
- Counters: `reactionCount` (denormalized total, `packages/reactions` is the source of truth), `revivalCount`
- `deletedAt: number | null` — soft delete, never a physical delete, so other repositories' `lineage` entries referencing this one stay intact
- Lineage entries reference `packages/user`
- Owner-facing panel API (Panel 1): `listMine`, `update` (autopsy/visibility), `softDelete`, `bury` (may attach an LLM-drafted autopsy, always unreviewed until the owner accepts it via `update`)
- Public API: `browsePublic`, `getPublicDetail`, `listMyLineage`, `importFromCandidate`
- UI state (`apps/mobile`'s `latent | reminder | buried | revived`) is a **derived view**, not a persisted field — see `openspec/specs/repository.md`'s state-mapping table. `haunted` MUST always correspond to an active `packages/reminders` row.

## Out of scope

- Calling GitHub (that is `packages/github`)
- Hand-typed / non-GitHub candidate mapping (that is `packages/manual-entry`)
- Reaction storage, notification storage, reminder storage, saved-idea storage (that is `packages/reactions`, `packages/notifications`, `packages/reminders`, `packages/saved-ideas` — this module only keeps the denormalized `reactionCount` and reacts to reminder state)
- Expo rendering (that is `apps/mobile`)
- Other networks

## Public API

Types plus a mapping from a `DomainCandidate` (GitHub or manual origin) → `Repository`, with `githubSyncedAt = now` only for `origin: github`, and `statusUpdatedAt` set only when status actually changes.

## Failure modes

Sync MUST update `githubSyncedAt` even if status does not change, for `origin: github` only. Status changes MUST bump `statusUpdatedAt`. Agents MUST NOT reuse one timestamp for both. A revive MUST trigger `packages/notifications` to notify the prior owner. `update` MUST NOT invent autopsy text when a field is cleared — it stays empty.

## Forbidden imports

`apps/**`. MAY import `packages/user` and `packages/domain`. MUST NOT import `packages/github`, `packages/manual-entry`, `packages/reactions`, `packages/notifications`, `packages/reminders`, `packages/saved-ideas`, or `packages/admin` (convex composes them all).
