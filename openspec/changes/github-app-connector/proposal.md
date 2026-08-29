# Ship the server-side GitHub App repository connector

This change delivers `packages/github` as a server-side GitHub App connector that lists installation-accessible repositories for a resolved user. It establishes the package boundary and repository-level public API without adding Convex routes, mobile UI, authentication-provider work, or draft pull request and unmerged branch discovery.

## Intent

Give server-side callers one typed boundary for GitHub App installation access so repository metadata can later be persisted and composed into unpublished-draft candidates by teammate-owned modules. The connector must use short-lived installation tokens, keep credentials off devices, and never invent autopsy content.

## Problem

The baseline defines GitHub as the source of unpublished work, but the workspace needs a module-scoped implementation that can safely:

- associate a GitHub App installation with an already resolved `userId`;
- report installation status and repository access scope;
- list installation-accessible repositories with enough metadata for later domain composition;
- avoid long-lived user OAuth tokens and cross-module coupling; and
- represent disconnect or GitHub-side revocation without requiring mobile code to call GitHub directly.

Without this package boundary, GitHub API access, installation ownership, token handling, and repository mapping would otherwise be implemented ad hoc in Convex or mobile code.

## What ships in this PR

The PR is limited to `packages/github/**` and `openspec/changes/github-app-connector/**`.

It ships:

- a `createGithubConnector` server-side connector factory;
- installation status lookup for a resolved `userId`;
- generation of the GitHub App installation URL from caller-provided state;
- verification and linking of a GitHub installation to one user, including rejection when it is already linked to another user;
- listing of installation-accessible repositories, including archived repositories, with stable metadata for later persistence and candidate composition;
- repository-to-candidate mapping with `origin: github` and `bucket: unpublished_draft`, without autopsy fields;
- short-lived installation-token caching behind an injectable server-side cache port;
- typed GitHub API failures;
- disconnect and signed installation-revocation webhook handling at the package boundary; and
- injectable storage ports so persistence remains owned by the Convex module.

Repository listing is the complete unpublished-work discovery slice in this change. Draft pull requests and unmerged branches are explicitly deferred and are not represented as shipped behavior.

## Public API

The contractual consumer-facing API remains:

```ts
github.getConnectionStatus({ userId })
  → {
      connected: boolean,
      installationId?: string,
      accountLogin?: string,
      scopeType: "all" | "selected"
    }

github.listRepositories({ userId })
  → Array<{
      id: string,
      fullName: string,
      private: boolean,
      defaultBranch: string,
      lastPushAt: string | null,
      isFork: boolean,
      isArchived: boolean
    }>

github.startConnection({ userId, state })
  → { installUrl: string }

github.disconnect({ userId })
  → { ok: boolean }
```

Supporting package APIs may verify/link installations, handle signed webhook input, inject storage and token-cache ports, and map repository records to candidates. They do not transfer ownership of HTTP routing, identity resolution, persistence, or UI into this package.

## Scope boundaries

### In scope

- Server-side GitHub App installation access.
- Installation ownership checks against the caller-supplied `userId`.
- Short-lived installation tokens cached only through a server-side port.
- Repository listing and repository metadata mapping.
- Archived repository visibility through `isArchived`.
- Repository-level unpublished-draft candidate mapping.
- Typed GitHub API errors.
- Signature verification and package-level handling for relevant installation revocation events.

### Non-goals and explicit leftovers

- **Draft pull requests and unmerged branches:** out of this change. Product/design must define their candidate semantics before a later connector slice implements them.
- **Convex `httpAction`s:** `/github/setup` and `/github/webhook`, raw-body handling, redirects, action composition, and deployment configuration remain teammate-owned work.
- **Convex persistence:** installation/repository tables, storage adapters, revocation persistence, repository clocks, and cross-module candidate persistence are not implemented here.
- **Expo wrapper:** WebBrowser usage, deep-link handling, connection result states, providers, UI, and device integration remain mobile-team work.
- **GitHub App credentials and operational setup:** App registration, App ID, slug, private key, webhook secret, callback/webhook configuration, and environment provisioning are not shipped. Credentials must remain in server-side Convex environment variables and must never reach the device.
- **Clerk:** webhook setup, session identity, `requireUser(ctx)`, and all auth-provider behavior are outside this module. This package only receives a resolved `userId`.
- **Teammate branch work:** work on `origin/auth/clerk-bootstrap`, including the Clerk webhook and Expo slug `cementerio-de-ideas`, is not part of this change and is not claimed as available on `main`.
- Long-lived GitHub user access tokens or raw user OAuth.
- Autopsy content such as `whyItDied` or `whatYouLearned`.
- Other connectors or changes to other package contracts/specifications.

## Done versus teammate-owned leftovers

| Area | Done by this change | Left for teammates or later changes |
| --- | --- | --- |
| GitHub package boundary | Connector factory, typed APIs, ports, error mapping | Runtime composition in Convex |
| Installation access | Start URL, status, ownership verification, short-lived token use | Authenticated callback route and persistence |
| Repository discovery | Installation-scoped repository listing and metadata mapping | Persistence, picker/UI, and refresh orchestration |
| Unpublished work | Repository-level candidate mapping only | Draft PR and unmerged branch semantics and discovery |
| Revocation | Signature verification and package-level revocation handling | Public webhook route, raw-body forwarding, durable state updates |
| Credentials | Package accepts server-side configuration | GitHub App creation, secrets, environment setup, webhook registration |
| Identity | Connector accepts a resolved `userId` | Clerk integration and Convex `requireUser(ctx)` |
| Mobile | No mobile responsibility | Expo wrapper, deep-link UX, and connection UI |

## Affected areas

- `packages/github/**`: connector implementation, ports, types, and package-local documentation/configuration.
- `openspec/changes/github-app-connector/**`: proposal and subsequent change artifacts.

No Convex, mobile, auth, domain, repository, shared baseline spec, or other connector module is changed by this proposal.

## Business and product rules

- A setup-returned `installation_id` is untrusted until verified against GitHub and linked to the authenticated user's resolved `userId` by the server-side composition layer.
- One installation must not be silently reassigned from one user to another.
- GitHub App private keys, webhook secrets, and installation tokens must remain server-side.
- The package must not persist a long-lived user token.
- Repository sync must expose metadata without inventing autopsy fields.
- Archived repositories remain visible and identifiable rather than being silently omitted.
- Future persistence updates must change `repository.githubSyncedAt` without changing `repository.statusUpdatedAt`; that clock behavior belongs to Convex/repository composition, not this package.

## Risks and mitigations

| Risk | Mitigation in this change | Remaining owner |
| --- | --- | --- |
| Repository-level records are mistaken for complete unpublished-work coverage | State clearly that draft PRs and unmerged branches are deferred | Product/design and a later GitHub change |
| Installation IDs are trusted from redirects | Expose verification/linking behavior and require authenticated server-side composition | Convex/auth integration |
| Credentials or tokens leak to mobile | Keep all GitHub App authentication and token caching behind server-side APIs and ports | Convex deployment configuration |
| Revocation is verified but not durably reflected | Keep signed webhook handling in the package and explicitly leave routing/persistence outside scope | Convex integration |
| GitHub API or malformed webhook failures are inconsistent | Use typed API failures; malformed JSON normalization remains a validation/hardening follow-up if not covered by this PR | Later package hardening |
| Behavior regresses without automated coverage | Add package-local tests if included by subsequent tasks; otherwise record package test-runner coverage as a named follow-up | This change planning or later GitHub change |

## Rollback

Rollback is module-local:

1. Revert the `github-app-connector` PR, or delete the newly introduced `packages/github` package if this is its only change.
2. Delete or revert `openspec/changes/github-app-connector/`.

No data migration, Convex deployment rollback, mobile rollback, credential rotation, or Clerk rollback is required because those areas do not ship in this change. If credentials were provisioned independently as operational work, their removal is a separate deployment action.

## Success criteria

- The public API reports connection status, creates an installation URL, lists repositories, and disconnects by resolved `userId`.
- Repository results contain `id`, `fullName`, privacy, default branch, push time, fork status, and archive status.
- Repository records can be mapped to candidates with `origin: github` and `bucket: unpublished_draft` without autopsy fields.
- Installation access uses short-lived GitHub App installation tokens and exposes no token to mobile consumers.
- Installation ownership conflicts are rejected rather than silently relinked.
- Signed installation revocation input can be validated and translated into package-level revoked state for a persistence adapter.
- The diff remains limited to `packages/github/**` and `openspec/changes/github-app-connector/**`.
- Reviewers can confirm that draft PRs, unmerged branches, Convex actions/persistence, Expo integration, GitHub App provisioning, and Clerk work are absent and explicitly left over.

## Proposal question round

The following product assumptions are proposed for review before approving the next phase:

1. **User value:** repository-level discovery is useful as the first slice even though it does not yet identify draft PRs or unmerged branches inside each repository.
2. **Candidate semantics:** each listed repository may be mapped as an unpublished-draft candidate now; later work-item discovery must not be implied by this mapping.
3. **Archive behavior:** archived repositories remain in results with `isArchived: true`, leaving filtering or presentation to downstream product flows.
4. **Failure posture:** if GitHub or persistence composition fails, the connector returns a typed failure and does not claim a partial connection or fabricate candidate data.
5. **First-slice boundary:** all user-facing connection UX, durable storage, runtime credentials, and identity resolution remain separate teammate deliverables.

Any correction to these assumptions should be applied before the specification and design phases; otherwise they define the proposal's product boundary.
