/**
 * The agnostic user shape every other module sees.
 *
 * No Clerk type ever crosses this boundary: `packages/user`, `packages/github`,
 * `packages/repository` and `apps/mobile` know about a `BusinessUser`, never
 * about a `clerkId`, a Clerk hook, or a webhook payload.
 */
export type BusinessUser = {
  /** Convex `users` document id — this is the `UserId` the domain modules key off. */
  id: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
};

/** Error codes thrown by the Convex side of this module, as `ConvexError` data. */
export const AuthErrorCode = {
  /** No valid Clerk session reached the Convex function (signed out, or revoked). */
  NotSignedIn: "NOT_SIGNED_IN",
  /**
   * A valid session exists but no `users` row does yet, and the caller was a
   * query, which cannot write. Callers resolve this by running the `ensureUser`
   * mutation; the client wrapper does it automatically on sign-in.
   */
  UserNotSynced: "USER_NOT_SYNCED",
} as const;

export type AuthErrorCode = (typeof AuthErrorCode)[keyof typeof AuthErrorCode];

export type AuthErrorData = {
  code: AuthErrorCode;
  message: string;
};
