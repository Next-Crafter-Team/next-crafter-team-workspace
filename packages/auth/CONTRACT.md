# Contract: `packages/auth`

Business identity and session, via Clerk. Sole bridge between Clerk and everything else.

## In scope

- Clerk session lifecycle: sign up, sign in, sign out, profile
- **Default sign-in method: Google** (Clerk Social Connection), configured as the primary option in the Clerk Dashboard. Email/password MAY stay enabled as a secondary method, never the default path.
- `requireUser(ctx)` — Convex helper, throws if no valid session
- `auth.getCurrentUser({})` — Convex query, agnostic shape
- `auth.ensureUser({})` — Convex mutation, creates the row if the webhook has not landed yet
- `useBusinessAuth()` — Expo wrapper (`getCurrentUser`, `isSignedIn`, `isLoading`, `signOut`, `openSignIn`)
- `users` table sync from Clerk `user.created|updated|deleted` webhook, plus lazy sync fallback
- Mounting `<ClerkProvider>` + `<ConvexProviderWithClerk>` in `apps/mobile`

## Out of scope

- Roles/permissions, billing/plans
- GitHub, or any other connector (`packages/github` is independent; only shared key is `userId`)
- Reactions, autopsies, repository state

## Public API

```ts
// Convex
requireUser(ctx) → Doc<"users">
auth.getCurrentUser({}) → { id: Id<"users">, email: string, name: string | null, imageUrl: string | null } | null
auth.ensureUser({}) → { id: Id<"users">, email: string, name: string | null, imageUrl: string | null }

// Expo
useBusinessAuth(): {
  getCurrentUser(): { id: string; email: string; name: string | null } | null;
  isSignedIn(): boolean;
  isLoading(): boolean;
  signOut(): Promise<void>;
  openSignIn(): void;
}
```

## Auth

Clerk Secret Key MUST stay in Convex env vars. Publishable Key is public and lives in the Expo client. Webhooks MUST verify the svix signature before processing. Convex validates the Clerk JWT (`convex/auth.config.ts`); it MUST NOT issue or store its own session tokens.

## Failure modes

Missing/stale `users` row on a valid JWT MUST be handled by lazy sync, not a hard failure. Revoked session MUST fail the Convex call and MUST be handled by the caller with `openSignIn()`, never retried silently.

`requireUser(ctx)` lazy-creates the row in a mutation, where a write is possible. In a query it throws `USER_NOT_SYNCED` instead of inventing a document id, because a synthetic id could be persisted as `repository.ownerUserId`. `useBusinessAuth()` runs `auth.ensureUser` once per sign-in, so a query never observes a signed-in user without a row. Queries that tolerate anonymous visitors MUST use `getCurrentUser(ctx)`, which returns `null` and never throws.

Errors are `ConvexError` with `{ code, message }`; `code` is `NOT_SIGNED_IN` or `USER_NOT_SYNCED`.

## Forbidden imports

`apps/**` MUST NOT import Clerk hooks directly — only this module's wrapper. `packages/github`, `packages/user`, `packages/repository`, `packages/domain` MUST NOT import Clerk types; they receive an already-resolved `userId`. MAY be imported by `convex` and by `apps/mobile` (wrapper only).

## Skills

Convex functions here MUST load `.agents/skills/convex-auth/SKILL.md` and `.agents/skills/convex/SKILL.md`.
