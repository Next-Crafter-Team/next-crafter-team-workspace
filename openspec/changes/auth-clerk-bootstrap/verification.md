# Verification log

Run against Clerk application "Cementerio de Ideas"
(`app_3IbgyW3Jj36BL8NDMvgMlbryb3m`, development instance) and a local Convex
deployment on `http://127.0.0.1:3210`.

Tokens were minted through Clerk's Backend API rather than a browser sign-in, so
these results prove the backend chain — Clerk-signed JWT, Convex validation,
identity resolution, row creation — but not the sign-in UI itself.

## Result

| # | Check | Result |
| --- | --- | --- |
| 1 | Anonymous `auth:getCurrentUser` | `null`, no error |
| 2 | `auth:ensureUser` with a Clerk-signed JWT | created `users` row, returned its Convex `_id` |
| 3 | Row carries the identity | `email`, `name` and `imageUrl` populated from the token |
| 4 | `auth:getCurrentUser` with the same JWT | same row, same `_id` |
| 5 | Idempotency: four `ensureUser` calls | one row, same `_id` every time |
| 6 | Tampered signature | `Unauthenticated — Could not verify OIDC token claim` |

## What this run found

**The `convex` JWT template is mandatory and was missing.** A default Clerk
session token (v2) carries no `aud` claim, so `auth.config.ts`'s
`applicationID: "convex"` rejected it:

```
NoAuthProvider — No auth provider found matching the given token. Check that
your JWT's issuer and audience match one of your configured providers:
[OIDC(domain=https://<instance>.clerk.accounts.dev, app_id=convex)]
```

`node_modules/convex/dist/esm/react-clerk/ConvexProviderWithClerk.js` confirms
the client's behavior: it calls `getToken({ template: "convex" })` unless
`sessionClaims.aud` is already `convex`. So the template is the path the app
actually takes, not an alternative to it.

**A template with only `aud` is not enough.** The first passing run produced a
`users` row with `email: ""` and `name: null`, because the lazy sync reads the
identity from the token. The template needs `email`, `name` and `picture` too.
`packages/auth/CONTRACT.md` now carries the exact claims.

**`user_model.first_name` / `last_name` are disabled on a new Clerk instance**,
which makes `{{user.full_name}}` resolve empty. Enabled on this instance.

## Still unverified

The browser half: tapping Sign in, Clerk's Account Portal rendering Google
first, and the hosted-auth callback returning to the app through the
`cementerio` URL scheme. Tasks 4.4 and 4.6 stay open until someone completes a
real Google sign-in on a device.
