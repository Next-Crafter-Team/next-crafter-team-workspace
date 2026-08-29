# Spec: saved ideas (new capability)

## Requirement: bookmark a repository to revisit later

`packages/saved-ideas` MUST store one row per `(userId, repositoryId)` — a personal bookmark, unrelated to ownership or reactions.

Public API:

```ts
savedIdeas.toggle({ repositoryId }) → { saved: boolean }
savedIdeas.listMine({}) → Array<{ repositoryId, createdAt, repository: Repository }>
```

### Scenario: save from the explore deck

- GIVEN a signed-in user swipes right on a repository in `apps/mobile`'s explore screen
- WHEN the client calls `savedIdeas.toggle({ repositoryId })`
- THEN a row MUST be created if none existed
- AND calling `toggle` again on the same repository MUST remove it (un-save), not create a duplicate

### Scenario: saving your own repository is allowed but pointless

- GIVEN a user owns repository `R`
- WHEN they save `R`
- THEN it MUST be allowed (no special-case error) — it just shows up in their own saved list alongside others'

### Scenario: anonymous visitors cannot save

- GIVEN no authenticated session
- WHEN `toggle` is called
- THEN it MUST be rejected

## Forbidden imports

`apps/**`, `packages/github`, `packages/auth` internals. MAY reference `packages/repository` and `packages/user` types (`RepositoryId`, `UserId`) only.
