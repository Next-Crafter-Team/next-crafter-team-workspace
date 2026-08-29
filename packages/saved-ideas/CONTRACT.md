# Contract: `packages/saved-ideas`

Personal bookmarks on other people's repositories — the explore screen's swipe-right.

## In scope

- One row per `(userId, repositoryId)`
- `toggle`, `listMine`

## Out of scope

- Recommendations/ranking on top of saves
- Anything about GitHub or Clerk

## Public API

```ts
savedIdeas.toggle({ repositoryId }) → { saved: boolean }
savedIdeas.listMine({}) → Array<{ repositoryId, createdAt, repository: Repository }>
```

## Auth

`toggle`/`listMine` MUST require a signed-in user (`packages/auth`'s unchanged `requireUser`). Anonymous callers MUST be rejected.

## Failure modes

Toggling twice on the same repository MUST un-save, never duplicate a row.

## Forbidden imports

`apps/**`, `packages/github`, `packages/auth` internals. MAY reference `packages/repository` and `packages/user` types only.
