// Convex validates the Clerk-issued JWT with this. It never issues or stores a
// session token of its own (convex/CONTRACT.md).
//
// CLERK_JWT_ISSUER_DOMAIN is a Convex deployment env var, not a repo file:
//   npx convex env set CLERK_JWT_ISSUER_DOMAIN https://<instance>.clerk.accounts.dev
//
// A wrong or missing value here does not error — it makes every request look
// signed out, silently. Check it first when auth "just does not work".
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
      applicationID: "convex",
    },
  ],
};
