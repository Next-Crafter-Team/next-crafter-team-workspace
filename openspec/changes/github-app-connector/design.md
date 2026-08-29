# Design: github-app-connector

## Decision

`packages/github` is a thin server-side module. Convex will call it later. This change does not implement Convex routes, Clerk, or Expo.

Public API (also listed in `docs/backend/endpoints.md` §4.4):

- `getConnectionStatus({ userId })`
- `listRepositories({ userId })`
- `startConnection({ userId, state })`
- `disconnect({ userId })`

Helpers Convex will need: `verifyAndLinkInstallation`, `handleWebhook`, `toUnpublishedDraftCandidate`.

## Runtime

GitHub App credentials stay in Convex env and are passed into the factory at call time:

- `GITHUB_APP_ID`
- `GITHUB_APP_SLUG`
- `GITHUB_APP_PRIVATE_KEY`
- `GITHUB_WEBHOOK_SECRET`

The owner creates the GitHub App. This package does not register it.

Listing is installation-scoped. `scopeType` is `"all"` or `"selected"`. Private repos appear only if the installation granted them. No scrape of public GitHub outside the install.

Draft PRs and unmerged branches are not in this design.

## Persistence

Durable rows (`github_installations`, `github_repositories`) belong to Convex. This package accepts a store object from the caller so it does not import `convex/`.

## Tests

Package-local Node test runner. GitHub is not called. No Playwright: there is no GitHub UI on this branch, and `apps/mobile` / `convex/http.ts` are owned by other PRs.

## Leftover (not this PR)

- `GET /github/setup`, `POST /github/webhook`, `POST /ideas/import`
- Clerk `requireUser`
- Expo `githubConnector.connect()`
- Live App credentials on a deployment
