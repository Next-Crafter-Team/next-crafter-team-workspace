# Tasks

## 1. Workspace and the auth package

- [x] 1.1 npm workspaces (`apps/*`, `packages/*`), `tsconfig.base.json`, root `tsconfig.json`
- [x] 1.2 Real test runner: vitest + convex-test, replacing the `exit 1` placeholder
- [x] 1.3 `@workspace/auth` with `./types`, `./server`, `./client` subpath exports
- [x] 1.4 `usersTable`, `requireUser`, `getCurrentUser`, `applyClerkEvent`, `verifyClerkWebhook`
- [x] 1.5 Point `package.json` `repository.url` at the team remote

## 2. Convex wiring

- [x] 2.1 `convex/auth.config.ts` validating the Clerk JWT
- [x] 2.2 `convex/schema.ts` with the `users` table and its `by_clerkId` index
- [x] 2.3 `convex/auth.ts`: `getCurrentUser` query, `ensureUser` mutation, `applyWebhookEvent` internal mutation
- [x] 2.4 `convex/http.ts`: `POST /clerk/webhook`, svix-verified, 400 on a bad signature
- [x] 2.5 `convex/auth.test.ts`: lazy sync does not duplicate the webhook row; `user.deleted` anonymizes; anonymous reads return null; `ensureUser` refuses a sessionless call
- [x] 2.6 Update `packages/auth/CONTRACT.md` for the shipped API

## 3. Expo app

- [x] 3.1 Scaffold Expo Router + TypeScript into `apps/mobile`, keeping `CONTRACT.md` and `mocks/`
- [x] 3.2 URL scheme `cementerio` and bundle identifier for the hosted-auth callback
- [x] 3.3 `BusinessAuthProvider` + `useBusinessAuth()` in `packages/auth/client`
- [x] 3.4 `_layout.tsx` mounts the provider; `index.tsx` proves the chain end to end
- [x] 3.5 `.env.example`; update `apps/mobile/CONTRACT.md` for the wrapper it now mounts

## 4. Manual verification (needs real Clerk and Convex credentials)

- [x] 4.1 Convex deployment with `CLERK_JWT_ISSUER_DOMAIN` set (local deployment; a hosted one still needed for devices)
- [x] 4.2 Google enabled as the default Social Connection
- [x] 4.2b JWT template `convex` created with the `aud`/`email`/`name`/`picture` claims — see `verification.md`
- [ ] 4.3 Register `<convex-site-url>/clerk/webhook` for `user.created|updated|deleted`; set `CLERK_WEBHOOK_SECRET`
- [ ] 4.4 Sign in with Google on a device; confirm the screen renders the email from the Convex query
- [x] 4.5 Exactly one `users` row per `clerkId`, verified over four `ensureUser` calls
- [ ] 4.6 Revoke the session in the Clerk Dashboard; confirm the app routes back to `openSignIn()`
