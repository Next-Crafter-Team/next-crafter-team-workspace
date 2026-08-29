# Contract: `packages/reminders`

Cron-driven nudges for inactive private repositories: up to 3 reminders before the owner is expected to keep, snooze, or bury.

## In scope

- `reminders` table: one active row per repository being nudged
- `respond({ reminderId, action: keep | snooze | bury })`
- Owner listing (`listMine`)

## Out of scope

- The cron itself (inactivity threshold, scheduling cadence) — implemented in `convex/`, this module only defines what the cron calls into
- Anything about GitHub or Clerk

## Public API

```ts
reminders.listMine({}) → Array<{ repositoryId, count, nextRunAt, repository: Repository }>
reminders.respond({ reminderId, action: "keep" | "snooze" | "bury" }) → { ok: boolean }
```

## Auth

`listMine`/`respond` MUST require the calling user to own the reminder's repository (`requireOwner`, resolved via `packages/auth`'s unchanged `requireUser`).

## Failure modes

Only the cron may increment `count`; `respond` may only reset it (`keep`) or leave it (`snooze`) or close it (`bury`). A repository MUST NOT stay `haunted` with no active reminder — `keep`/`bury` MUST flip `repository.status` back accordingly.

## Forbidden imports

`apps/**`, `packages/github` internals, `packages/auth` internals. MAY reference `packages/repository` and `packages/user` types only.
