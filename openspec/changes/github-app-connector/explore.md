# Exploration: GitHub App connector

## What this change is

`github-app-connector` is the `packages/github` library for finding unpublished GitHub work through a GitHub App installation. It is a server-side connector boundary: it receives a resolved `userId`, uses installation-scoped short-lived tokens, verifies webhook signatures, and exposes GitHub data that can become `origin: github`, `bucket: unpublished_draft` candidates.

It is not the mobile connection experience or the Convex persistence layer.

## Current branch versus the baseline

| Area | Present on `github/app-connector` | Assessment against the contracts/specs |
| --- | --- | --- |
| Connector factory | `createGithubConnector` in `packages/github/src/github.ts` | Present and scoped to the GitHub App installation model. |
| Connection status | `getConnectionStatus({ userId })` | Matches the baseline shape and reports `all`/`selected` repository scope. |
| Installation start | `startConnection({ userId, state })` | Builds the GitHub App installation URL; the caller still owns authenticated state creation and callback handling. |
| Ownership verification | `verifyAndLinkInstallation({ userId, installationId })` | Checks the installation with GitHub and rejects an installation already linked to another user. Convex must still resolve `userId` with `requireUser(ctx)` before calling it. |
| Repository sync | `listRepositories` plus `InstallationStore.replaceRepositories` | Fetches installation-accessible repositories, including archived repositories, and preserves metadata such as default branch, fork status, and last push time. |
| Candidate mapping | `toUnpublishedDraftCandidate` and `listRepositoriesAsCandidates` | Provides the expected GitHub/unpublished-draft mapping and does not invent autopsy fields. The main `listRepositories` method still returns repository records rather than candidates, so the Convex/domain composition remains unfinished. |
| Token handling | Octokit GitHub App auth plus an injectable in-memory token cache | No long-lived user token is persisted or exposed by this package. A deployment-specific server-side cache may still be supplied by Convex. |
| Disconnect and revocation | `disconnect` and signed `handleWebhook` support deletion/suspension revocation | The library marks installations revoked and clears its token cache; Convex must preserve cemetery repositories and persist the installation state. |
| Package boundary | `InstallationStore` and `InstallationTokenCache` ports; no imports from apps, auth, or Convex | Matches the one-module boundary and leaves persistence/auth composition to teammates. |

## Gaps and leftover work

### GitHub unpublished-work coverage

The current implementation lists repositories, but it does not query or represent draft pull requests or unmerged branches. It therefore cannot yet distinguish those work items from a repository-level candidate. The next design/spec decision should define whether those are additional candidate records, repository metadata used by a later picker, or a deliberately deferred slice. Archived repositories are represented through `isArchived` and are available to the caller.

### Convex integration (owned by the Convex module)

Convex still needs to provide the `httpAction` routes and adapters around this library:

- `/github/setup`: resolve the signed-in user, validate the returned `installation_id` against GitHub, persist the installation and repositories, and redirect to the Expo deep link.
- `/github/webhook`: preserve the raw request body, pass the signature/event headers to `handleWebhook`, and persist revocation and repository metadata changes.
- `InstallationStore` persistence for `github_installations` and `github_repositories`.
- Convex action configuration that reads the GitHub App ID, slug, private key, and webhook secret from environment variables only.
- Composition that turns connector output into domain candidates and updates `repository.githubSyncedAt` without changing `repository.statusUpdatedAt`.

The repository currently has only the Convex contract; there are no implemented actions, schema, deployment, or credential registration to verify. The real GitHub App and its webhook configuration are also still operational setup work.

### Expo/mobile integration (owned by the mobile/app integration work)

The mobile contract mentions an Expo wrapper with `githubConnector.connect()`, `WebBrowser`, and a deep-link callback that resolves to `success`, `cancelled`, or `error`. No Expo wrapper or mobile runtime exists in this branch. `packages/github` must not absorb that UI/device responsibility, and the device must never receive GitHub tokens.

### Tests and validation

There are no repository tests or test runner configuration. The root `npm test` script is only a failing placeholder, and `packages/github` has no test script. Strict TDD is therefore disabled. If behavioral acceptance of this connector is part of this change, add a package-local test runner and tests for token reuse/expiry, ownership checks, candidate mapping, API error typing, and webhook verification/idempotent revocation. If tests are outside this change's scope, record them as an explicit follow-up rather than adding an unrelated workspace-wide runner. The Expo app cannot be launched because no app exists.

The webhook parser also has a remaining hardening question: malformed JSON currently escapes as a native parse error rather than a typed `GithubError`. This should be covered by the chosen test/validation scope.

## Explicit non-goals

- Clerk, session identity resolution, or auth-provider behavior.
- Mobile UI, Expo providers, WebBrowser usage, deep-link UX, or device tokens.
- Convex tables, `httpAction` implementations, auth wiring, or file storage.
- YouTube, Luma, Zernio, TikTok, Instagram, LinkedIn, or any other connector.
- Autopsy prose or values for `whyItDied` and `whatYouLearned`.
- Long-lived GitHub user access tokens.

## How teammates should read done versus leftover

**Done in this module:** the GitHub App client boundary, installation-scoped API access, short-lived token caching, typed API error mapping, installation ownership guard, repository metadata mapping, disconnect behavior, and webhook signature/revocation handling are present under `packages/github/`.

**Leftover outside this module:** Convex owns identity resolution, secrets, HTTP routes, persistence adapters, repository clocks, and cross-module candidate composition. Mobile owns the Expo connection wrapper and UI. Product/design work must decide the draft-PR and unmerged-branch candidate semantics before extending the library. Tests are either a package-local addition in this change or a named follow-up; they are not available today.

Per `CONTRIBUTING.md`, this branch should remain limited to `packages/github/**` and this change folder, with teammate-owned work delivered in separate module changes.
