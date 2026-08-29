# Proposal: repository panel lifecycle (listMine, update, softDelete, bury)

## Why

`docs/backend/endpoints.md` (written by the mobile team, reconciling their backend proposal against our specs) maps Panel 1 ("Mi Cementerio") to `repositories.listMine/update/softDelete/bury`, none of which are formalized yet. It also surfaces a real mismatch: `apps/mobile/src/data/graves.ts` already ships `GraveState = 'buried' | 'latent' | 'reminder' | 'revived'` as its UI state — a different shape than `repository.status`. This formalizes both without renaming the persisted `status` enum, since the endpoints doc itself already leans toward deriving the UI states rather than adding them to the enum.

## In scope

- `deletedAt: number | null` — soft delete, preserves `lineage`
- `repositories.listMine`, `.update` (autopsy + visibility), `.softDelete`, `.bury`, `.browsePublic`, `.getPublicDetail`, `.listMyLineage`, `.importFromCandidate` named as the public API
- Formal mapping from persisted `status`/`visibility`/active-reminder to the UI state (`latent | reminder | buried | revived`) `apps/mobile` already renders — a view derivation, not a new stored enum value
- `bury` MAY trigger an LLM-drafted autopsy suggestion; the draft MUST be marked as unreviewed and MUST NOT be shown as final until the owner accepts/edits it

## Out of scope

- `packages/auth`, `packages/github` — untouched, other teams own these
- `reminders`, `saved_ideas` tables/cron (separate changes)
- Admin/moderation (separate change)

## Clarifies (does not change)

The endpoints doc's draft mentions a third visibility value `public_no_code`, alongside `public`/`private`. The existing requirement already guarantees `public` never returns file contents (`repository.md`, "public autopsy hides source code"), so a distinct `public_no_code` would be redundant with `public`. This change keeps `visibility: public | private` (two values) and documents that `public` already means "autopsy public, code never shown," so nobody implements a confusing third state.
