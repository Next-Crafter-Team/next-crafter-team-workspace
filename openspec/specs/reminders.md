# Spec: reminders

_Baseline. Added by `reminders-module` (archived)._

## Requirement: the system nudges inactive private repositories, up to 3 times

`packages/reminders` MUST store one row per `(repositoryId)` with an active reminder: `{ repositoryId, ownerUserId, count: 0..3, nextRunAt: number, status: "active" | "closed", lastRespondedAt?: number }`. A user MUST NOT create a reminder directly — only the `convex` cron creates/advances them (a `haunted` repository always has a corresponding active row here, per `specs/repository.md`).

Public API:

```ts
reminders.listMine({}) → Array<{ repositoryId, count, nextRunAt, repository: Repository }>

reminders.respond({ reminderId, action: "keep" | "snooze" | "bury" }) → { ok: boolean }
```

### Scenario: keep resets the count

- GIVEN an active reminder with `count: 2`
- WHEN the owner responds `keep`
- THEN `count` MUST reset to `0`
- AND `nextRunAt` MUST be rescheduled far out (the "keep interval")
- AND `repository.status` MUST return to `buried`

### Scenario: snooze does not reset the count

- GIVEN an active reminder with `count: 2`
- WHEN the owner responds `snooze`
- THEN `count` MUST stay `2`
- AND `nextRunAt` MUST be rescheduled soon (the "snooze interval")
- AND `repository.status` MUST stay `haunted`

### Scenario: bury closes the reminder

- GIVEN an active reminder
- WHEN the owner responds `bury`
- THEN the reminder's `status` MUST become `closed`
- AND `repositories.bury` MUST run per `specs/repository.md` (transition to `buried` + `visibility: public`, optional autopsy draft)

### Scenario: only the cron advances the counter

- GIVEN a private, `origin: github` repository inactive past the threshold
- WHEN the cron runs
- THEN it MUST increment that repository's reminder `count` (capped at 3), reschedule `nextRunAt`, and set `repository.status = haunted` if not already
- AND a user-initiated call MUST NOT be able to increment `count` directly — only `respond` (which resets or holds it) or the cron may change it

## Forbidden imports

`apps/**`, `packages/github` internals, `packages/auth` internals. MAY reference `packages/repository` and `packages/user` types (`RepositoryId`, `UserId`) only. The cron that drives this module lives in `convex/`, not here.
