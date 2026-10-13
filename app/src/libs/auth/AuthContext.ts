import { createContext, useContext } from 'react';
import type { MeItem } from '@/types/v2User';

/**
 * Sign-in state shared with the whole app. This module has no Auth0
 * dependency, so code that only reads the state (stores, menus, the
 * legacy Vite build) never bundles the SDK. Without an AuthProvider in
 * the tree the state is 'disabled' and the app behaves exactly as it
 * does without sign-in.
 */

/**
 * - 'loading': the session (or, in the US and UK, the PolicyEngine user
 *   behind it) is still being restored.
 * - 'authenticated': signed in; in the US and UK the PolicyEngine user
 *   has loaded.
 * - 'account_error': signed in, but the PolicyEngine user could not be
 *   loaded (US and UK). Saved work is unavailable, never silently kept
 *   on this device, until `retryAccount` succeeds or the user signs out.
 */
export type AuthStatus = 'disabled' | 'loading' | 'anonymous' | 'authenticated' | 'account_error';

/** Display details from the identity provider (Auth0 ID token claims). */
export interface AuthProfile {
  name: string | null;
  email: string | null;
  picture: string | null;
}

export interface AuthContextValue {
  status: AuthStatus;
  /** The PolicyEngine user (`GET /v2/me`), once loaded; null otherwise. */
  user: MeItem | null;
  profile: AuthProfile | null;
  /** Why sign-in or loading the PolicyEngine user failed, when it did. */
  error: Error | null;
  /** Redirects to the hosted sign-in page; returns to `returnTo` (default: here). */
  signIn: (returnTo?: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Tries loading the PolicyEngine user again (after 'account_error'). */
  retryAccount: () => void;
  /** An access token for the PolicyEngine API, or null when signed out. */
  getAccessToken: () => Promise<string | null>;
}

export const DISABLED_AUTH: AuthContextValue = {
  status: 'disabled',
  user: null,
  profile: null,
  error: null,
  signIn: async () => {},
  signOut: async () => {},
  retryAccount: () => {},
  getAccessToken: async () => null,
};

export const AuthContext = createContext<AuthContextValue>(DISABLED_AUTH);

export function useAuthStatus(): AuthContextValue {
  return useContext(AuthContext);
}

export const authKeys = {
  all: ['auth'] as const,
  me: (subject: string) => ['auth', 'me', subject] as const,
};
