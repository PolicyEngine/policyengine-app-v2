import { createContext, useContext } from 'react';
import type { MeItem } from '@/types/v2User';

/**
 * Sign-in state shared with the whole app. This module has no Auth0
 * dependency, so code that only reads the state (stores, menus, the
 * legacy Vite build) never bundles the SDK. Without an AuthProvider in
 * the tree the state is 'disabled' and the app behaves exactly as it
 * does without sign-in.
 */

export type AuthStatus = 'disabled' | 'loading' | 'anonymous' | 'authenticated';

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
