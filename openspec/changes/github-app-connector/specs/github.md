# Delta for github

This change delivers the server-side `packages/github` GitHub App connector. It feeds the cemetery of ideas with installation-accessible repositories as unpublished-draft candidates. Canonical Convex `httpAction`, persistence-clock, and mobile scenarios in `openspec/specs/github.md` remain teammate-owned leftovers and are not modified here.

Assumption: the proposal has no `Capabilities` section; this delta applies only to domain `github`.

## ADDED Requirements

### Requirement: Connector is a server-side GitHub App package boundary

`packages/github` MUST expose a server-side connector factory that accepts GitHub App configuration, an injectable installation store, and an injectable short-lived installation-token cache. Callers MUST supply an already resolved `userId`. The package MUST NOT resolve identity, MUST NOT implement Convex HTTP routes or persistence tables, and MUST NOT own mobile or Clerk behavior.

The consumer-facing API MUST include:

```ts
github.getConnectionStatus({ userId })
  → { connected: boolean, installationId?: string, accountLogin?: string, scopeType: "all" | "selected" }

github.listRepositories({ userId })
  → Array<{ id, fullName, private, defaultBranch, lastPushAt, isFork, isArchived }>

github.startConnection({ userId, state })
  → { installUrl: string }

github.disconnect({ userId })
  → { ok: boolean }
```

Supporting package APIs MAY verify and link an installation, handle signed webhook input, and map repository records to candidates. They MUST NOT transfer HTTP routing, identity resolution, durable storage, or UI into this package.

#### Scenario: status for a connected user

- GIVEN an active installation linked to `userId`
- WHEN `getConnectionStatus({ userId })` is called
- THEN the result MUST have `connected: true`
- AND MUST include that installation's `installationId`, `accountLogin`, and `scopeType` of `"all"` or `"selected"`

#### Scenario: status without an active installation

- GIVEN no active installation for `userId`
- WHEN `getConnectionStatus({ userId })` is called
- THEN the result MUST have `connected: false`
- AND MUST NOT present that user as connected

#### Scenario: start connection URL

- GIVEN a resolved `userId` and caller-provided `state`
- WHEN `startConnection({ userId, state })` is called
- THEN the result MUST include an installation URL for the configured GitHub App
- AND that URL MUST carry the caller-provided `state`
- AND the package MUST NOT create or persist GitHub credentials on a device

### Requirement: Listing is installation-scoped only

`listRepositories` MUST return only repositories the GitHub App installation can access for that user. It MUST include public repositories granted to the installation and private repositories only when the installation's repository selection grants access (`scopeType` `"all"` or `"selected"`). It MUST NOT scrape, search, or otherwise list arbitrary public GitHub repositories outside the installation.

Archived repositories that are installation-accessible MUST remain in the result with `isArchived: true`. Each item MUST include `id`, `fullName`, `private`, `defaultBranch`, `lastPushAt`, `isFork`, and `isArchived`. `lastPushAt` MUST be null when GitHub provides no push time.

This change's unpublished-work discovery slice MUST be repository listing only. The connector MUST NOT list, map, or otherwise represent draft pull requests or unmerged branches.

#### Scenario: selected repositories

- GIVEN an active installation whose `scopeType` is `"selected"`
- WHEN `listRepositories({ userId })` succeeds
- THEN every returned repository MUST be one the installation was granted
- AND no repository outside that grant MUST appear, including public repositories on GitHub

#### Scenario: all repositories on the account

- GIVEN an active installation whose `scopeType` is `"all"`
- WHEN `listRepositories({ userId })` succeeds
- THEN the result MUST include installation-accessible public and private repositories for that installation
- AND MUST NOT include repositories that do not belong to that installation

#### Scenario: archived repositories stay visible

- GIVEN an installation-accessible archived repository
- WHEN `listRepositories({ userId })` succeeds
- THEN that repository MUST appear
- AND `isArchived` MUST be `true`

#### Scenario: draft PRs and unmerged branches are not this slice

- GIVEN an active installation that has draft pull requests or unmerged branches
- WHEN `listRepositories` or candidate mapping runs
- THEN the result MUST be repository records or repository-level candidates only
- AND MUST NOT include draft pull request or unmerged branch items

#### Scenario: not connected listing

- GIVEN no active installation for `userId`
- WHEN `listRepositories({ userId })` is called
- THEN the connector MUST return a typed failure
- AND MUST NOT return fabricated repositories or candidates

### Requirement: Repository records map to unpublished-draft candidates without autopsies

Listed repositories MUST be mappable to domain candidates with `origin: github`, `bucket: unpublished_draft`, and `contentType: repo`. Each mapped candidate MUST include enough data to create a later `repository` (`githubFullName`, title/name, `defaultBranch`). The package MUST NOT set `whyItDied` or `whatYouLearned`.

#### Scenario: map a listed repository

- GIVEN a listed repository with `fullName` and `defaultBranch`
- WHEN it is mapped to a candidate
- THEN the candidate MUST have `origin: github`, `bucket: unpublished_draft`, and `contentType: repo`
- AND MUST include `githubFullName`, title/name, and `defaultBranch`
- AND MUST NOT include autopsy fields

### Requirement: Installation linking is verified and ownership-safe

A setup-returned `installation_id` MUST be treated as untrusted until the package verifies it against GitHub and links it to the caller-supplied `userId`. One installation MUST NOT be silently reassigned from one user to another. GitHub App private keys, webhook secrets, and installation tokens MUST remain server-side. The package MUST persist only short-lived installation tokens through the server-side cache port and MUST NOT persist a long-lived GitHub user access token.

#### Scenario: verify before link

- GIVEN a caller-supplied `userId` and an `installation_id`
- WHEN the package verifies and links that installation
- THEN it MUST confirm the installation with GitHub before treating it as linked
- AND MUST associate it with that `userId`

#### Scenario: reject foreign ownership

- GIVEN an installation already linked to user A
- WHEN user B attempts to link the same installation
- THEN the package MUST reject the link with a typed failure
- AND MUST NOT reassign the installation to user B

### Requirement: Disconnect and signed revocation are handled at the package boundary

`disconnect({ userId })` MUST revoke the package-level installation association for that user when an active installation exists. The package MUST verify signed installation-revocation webhook input and translate a valid uninstall or equivalent revocation event into revoked state for the injectable store. The package MUST NOT wait for a later user action to apply that revoked state. Durable Convex webhook routing and cemetery-document preservation remain outside this package.

#### Scenario: explicit disconnect

- GIVEN an active installation for `userId`
- WHEN `disconnect({ userId })` is called
- THEN the result MUST report success
- AND subsequent `getConnectionStatus({ userId })` MUST have `connected: false`

#### Scenario: signed revocation

- GIVEN signed webhook input for an installation deletion or equivalent revocation
- WHEN the package handles that input
- THEN it MUST reject the payload if the signature is invalid
- AND on a valid revocation event it MUST mark that installation revoked through the store
- AND MUST NOT require the user to reopen a client for that package-level state change

### Requirement: GitHub API failures are typed and non-fabricating

GitHub API and verification failures MUST be returned as typed errors. The connector MUST NOT claim a partial connection, MUST NOT invent candidate or autopsy data, and MUST NOT expose installation tokens to mobile consumers.

#### Scenario: GitHub API failure

- GIVEN GitHub rejects or fails a connector call that talks to GitHub
- WHEN the package surfaces that failure
- THEN the failure MUST be a typed GitHub error
- AND MUST NOT return a successful connection or fabricated candidates

### Requirement: Package-local tests run without a live GitHub App

This change MUST include automated tests inside `packages/github` that cover typed errors, ownership rejection, candidate mapping, webhook signature verification, and `selected` versus `all` listing. Those tests MUST run with a fake store and a mocked GitHub client. They MUST NOT require live GitHub App credentials.

#### Scenario: tests without operational credentials

- GIVEN the package test suite
- WHEN it is run without a real GitHub App or live secrets
- THEN the required cases MUST execute against a fake store and mocked GitHub access
- AND MUST NOT depend on operational leftover credentials
