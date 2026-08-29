# Contract: `apps/mobile`

Expo client. Talks only to Convex.

## MVP

Show GitHub-sourced candidates and autopsies. No other networks.

## In scope

- Screens via Convex React client: browse, repository detail, import (GitHub), upload (manual entry), "Mis recordatorios" (owner-scoped listing), notifications
- Visit without account MAY be allowed
- Writing an autopsy, uploading manually, reacting, and viewing "Mis recordatorios"/notifications MUST require login
- Mounting `<BusinessAuthProvider>` from `packages/auth/client` — it owns `<ClerkProvider>` + `<ConvexProviderWithClerk>` internally — and calling `useBusinessAuth()` for sign-in/out UI
- Calling `githubConnector.connect()` (from `packages/github`'s Expo wrapper) to start a GitHub App installation
- Evidence upload in the manual-entry screen goes through a Convex-issued upload URL, never a third-party host

## Out of scope

- GitHub/YouTube/Zernio/Luma SDKs
- Clerk hooks used directly (`useAuth`, `useUser`) — only `packages/auth`'s wrapper
- API keys, GitHub tokens, or Clerk secret keys on device
- Map vs feed product decision (still unresolved; keep UI simple)

## Forbidden imports

`packages/github` internals (only its Expo wrapper), Clerk SDK types. MUST NOT import Convex internals other than generated client APIs.

## Skills

No Expo skill on current `main`.
