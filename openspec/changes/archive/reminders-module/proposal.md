# Proposal: reminders (cron-driven, formalized)

## Why

`Panel.html` and `apps/mobile/src/data/panel.ts` already show reminders with a step counter (1/3, 2/3, 3/3) and copy like "pospuesto 2 veces". The earlier pass only gave owners a listing of their own private repos; this formalizes the actual entity: the system, via a cron, nudges an inactive private repository through up to 3 reminders before it's expected to be buried or kept.

## In scope

- New module `packages/reminders`: `reminders` table, `listMine`, `respond`
- The cron itself lives in `convex` (per `module-contracts.md`), calling into this module's mutations — this change specs the module's contract, not the cron's scheduling code

## Out of scope

- The cron's exact inactivity threshold / scheduling cadence — an implementation detail for whoever builds `convex/crons.ts`, not a spec-level contract
- `packages/github`, `packages/auth` — untouched

## Success

A private, inactive GitHub-origin repository accumulates reminders automatically; the owner can keep, snooze, or bury from `apps/mobile`'s panel without the reminder logic living anywhere but this module + the cron that drives it.
