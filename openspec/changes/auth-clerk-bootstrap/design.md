# Design: Clerk auth bootstrap

Implements `specs/auth.md`. Supersedes one detail of the archived
`business-auth-github-app/design.md`: that document assumed a Clerk JWT template
named `convex`. Recent Clerk-Convex integrations use the default session token
instead. `convex/auth.config.ts` still declares `applicationID: "convex"`, so
either path works; whichever the Clerk Dashboard offers is fine.

## D1 — one package, two entry points, no build step

`convex/CONTRACT.md` forbids Expo/React Native imports inside `convex/`, and
`apps/mobile/CONTRACT.md` forbids Convex internals. One package with subpath
exports keeps both true without a second package to version:

```
@workspace/auth/types   BusinessUser, AuthErrorCode      (no runtime deps)
@workspace/auth/server  usersTable, requireUser, getCurrentUser,
                        applyClerkEvent, verifyClerkWebhook
@workspace/auth/client  BusinessAuthProvider, useBusinessAuth
```

Raw TypeScript source, no `dist/`. Convex's esbuild and Metro both consume
workspace TypeScript directly, so there is no build to keep in sync.

`packages/auth/server` types its Convex context against a local
`defineSchema({ users: usersTable })`, and `convex/schema.ts` spreads that same
`usersTable` in. The app's real `MutationCtx` is structurally assignable to it,
so the helpers stay usable from a `convex/` that has many more tables.

## D2 — `convex/` never names a Clerk type

`verifyClerkWebhook` returns an opaque `ClerkWebhookPayload`
(`Record<string, unknown>`) and `applyClerkEvent` consumes it. `convex/http.ts`
routes the body from one to the other and never inspects it; the internal
mutation validates it as `v.any()`. Re-declaring Clerk's payload shape would
both break on every Clerk field addition and put a Clerk type inside `convex/`,
which `specs/auth.md` forbids.

## D3 — `openSignIn()` is Clerk's hosted Account Portal

`useHostedAuth().startHostedAuth()` from `@clerk/expo/hosted-auth` opens Clerk's
own sign-in page in a system browser session and hands the session back. Google
being the primary option stays a Clerk Dashboard setting rather than a strategy
hard-coded here, which is what `specs/auth.md`'s two sign-in scenarios ask for,
and no custom sign-in UI exists to drift from it. The app's URL scheme
(`cementerio`) and bundle identifier carry the native callback.

## D4 — `user.deleted` anonymizes

`specs/flows.md` requires this decision be recorded before implementation. The
`users` row is kept with `clerkId` intact; `email`, `name` and `imageUrl` are
cleared and `deletedAt` is set. Repositories that user buried keep a valid
`ownerUserId` and lineage stays readable. A later `user.updated` for the same
`clerkId` clears `deletedAt`, reviving the row. A hard delete would cascade into
`repository` documents the same spec says must not silently disappear.

## D5 — lazy sync writes only where writing is possible

`requireUser(ctx)` throws `NOT_SIGNED_IN` without an identity. With one, it
returns the existing row; if none exists and the context can write, it inserts.
Convex mutations are serializable, so the lazy insert and the webhook upsert
cannot both create a row — whichever commits second reads the first one's write.

In a query context, which cannot write, a missing row throws `USER_NOT_SYNCED`
rather than returning a synthesized document: an id that does not exist in the
table could be persisted as `repository.ownerUserId`. `BusinessAuthProvider`
runs the `auth.ensureUser` mutation as soon as the session authenticates, so a
query observing this means the row was never created, not that it is merely
late.

Queries that serve anonymous visitors use `getCurrentUser(ctx)`, which returns
`null` and never throws.

## D6 — the client reads the domain id from Convex, not from Clerk

`useBusinessAuth().getCurrentUser()` resolves through the `auth.getCurrentUser`
Convex query, so `BusinessUser.id` is the Convex `users` document id that
`packages/user` defines as `UserId`. Returning Clerk's `user.id` there would put
a Clerk identifier one assignment away from `repository.ownerUserId`.

The client references its own Convex functions by name through
`makeFunctionReference` rather than importing `convex/_generated`, which
`packages/**` may not reach into.
