# Contract: `apps/mobile`

Expo client. Talks only to Convex.

## MVP

Show GitHub-sourced and manual candidates, autopsies, and the two panels (Panel 1 "Mi Cementerio" for any creator, Panel 2 admin for `role: admin` only). No other networks.

## In scope

- Screens: explore/browse, repository detail, GitHub import, manual upload, Panel 1 (`src/app/admin/` — my ideas, reminders, saved, lineage), login, notifications. Panel 2 (admin) is UI-only scaffolding until `packages/admin` is implemented; it MUST re-derive admin gating from the server (`admin.*` calls failing for non-admins), never trust a locally-cached role
- Visit without account MAY be allowed for browse/detail
- Writing/editing an autopsy, uploading manually, reacting, saving, reminders, and any Panel 1/2 screen MUST require login
- Mounting `<ClerkProvider>` + `<ConvexProviderWithClerk>` and calling `useBusinessAuth()` for sign-in/out UI (both from `packages/auth`)
- Calling `githubConnector.connect()` (from `packages/github`'s Expo wrapper) to start a GitHub App installation
- Evidence upload in the manual-entry screen goes through a Convex-issued upload URL, never a third-party host
- `GraveState` (`src/data/graves.ts`: `latent | reminder | buried | revived`) is a client-side derivation from `repository.status` + `visibility` + active reminder — see `openspec/specs/repository.md`'s state-mapping table. It MUST be computed from what Convex returns, never hardcoded per screen

## Out of scope

- GitHub/YouTube/Zernio/Luma SDKs
- Clerk hooks used directly (`useAuth`, `useUser`) — only `packages/auth`'s wrapper
- API keys, GitHub tokens, or Clerk secret keys on device
- Trusting a client-held `role` for admin UI gating — always re-verified server-side

## Forbidden imports

`packages/github` internals (only its Expo wrapper), Clerk SDK types. MUST NOT import Convex internals other than generated client APIs.

## Skills

Read `apps/mobile/AGENTS.md` (Expo v57 docs pointer) before touching this app; use the `expo:*` skill family (`expo-overview` first) for anything Expo-specific.
