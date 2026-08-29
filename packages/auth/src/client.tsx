/**
 * Expo side of `packages/auth`.
 *
 * `apps/mobile` mounts `<BusinessAuthProvider>` and calls `useBusinessAuth()`.
 * It never imports a Clerk hook, a Clerk type, or `ConvexProviderWithClerk`
 * itself — that is the whole point of this file (`specs/auth.md`).
 */
import { ClerkProvider, useAuth } from "@clerk/expo";
import { useHostedAuth } from "@clerk/expo/hosted-auth";
import { tokenCache } from "@clerk/expo/token-cache";
import { ConvexReactClient, useConvexAuth, useMutation, useQuery } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { makeFunctionReference } from "convex/server";
import { useCallback, useEffect, useMemo, type ReactNode } from "react";

import type { BusinessUser } from "./types";

// This module defines those Convex functions in `convex/auth.ts`, so it can
// reference them by name instead of importing `convex/_generated`, which
// `apps/**` and `packages/**` are not allowed to reach into.
const getCurrentUserRef = makeFunctionReference<
  "query",
  Record<string, never>,
  BusinessUser | null
>("auth:getCurrentUser");

const ensureUserRef = makeFunctionReference<"mutation", Record<string, never>, BusinessUser>(
  "auth:ensureUser",
);

export type BusinessAuth = {
  /**
   * The signed-in user, or null while signed out or still loading.
   * `id` is the Convex `users` document id — the `UserId` every domain module keys off.
   */
  getCurrentUser(): BusinessUser | null;
  isSignedIn(): boolean;
  isLoading(): boolean;
  signOut(): Promise<void>;
  /** Opens the sign-in flow. Google is the primary option, configured in the Clerk Dashboard. */
  openSignIn(): void;
};

export type BusinessAuthProviderProps = {
  children: ReactNode;
  /** Clerk Publishable Key. Public by design; the Secret Key stays in Convex env vars. */
  publishableKey: string;
  /** Convex deployment URL. */
  convexUrl: string;
};

export function BusinessAuthProvider({
  children,
  publishableKey,
  convexUrl,
}: BusinessAuthProviderProps) {
  const convex = useMemo(() => new ConvexReactClient(convexUrl), [convexUrl]);

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <EnsureUserRow />
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

export function useBusinessAuth(): BusinessAuth {
  const { isLoading: isConvexLoading, isAuthenticated } = useConvexAuth();
  const { signOut } = useAuth();
  const { startHostedAuth } = useHostedAuth();
  const user = useQuery(getCurrentUserRef, isAuthenticated ? {} : "skip");

  // Clerk's Account Portal, opened in a system browser session. It renders
  // whatever the Dashboard has configured, so Google stays the default sign-in
  // method without this module hard-coding a strategy.
  const openSignIn = useCallback(() => {
    void startHostedAuth().catch(() => {
      // Cancelling the browser session is a normal outcome, not an error state.
    });
  }, [startHostedAuth]);

  return {
    getCurrentUser: () => user ?? null,
    isSignedIn: () => isAuthenticated,
    isLoading: () => isConvexLoading || (isAuthenticated && user === undefined),
    signOut: async () => {
      await signOut();
    },
    openSignIn,
  };
}

/**
 * Creates the Convex `users` row as soon as the session is authenticated, so no
 * query ever observes a signed-in user without a record — the Clerk webhook can
 * take a moment, or never arrive in a local deployment.
 *
 * Idempotent: `ensureUser` returns the existing row when there is one.
 */
function EnsureUserRow() {
  const { isAuthenticated } = useConvexAuth();
  const ensureUser = useMutation(ensureUserRef);

  useEffect(() => {
    if (!isAuthenticated) return;
    void ensureUser({}).catch(() => {
      // Self-healing: any later mutation runs requireUser, which creates the
      // row anyway. Nothing worth interrupting the user for.
    });
  }, [isAuthenticated, ensureUser]);

  return null;
}
