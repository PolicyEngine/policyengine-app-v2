import { createContext, useContext } from 'react';

/**
 * Sign-in state for the v3 workspace. This module has no Auth0
 * dependency, so code that only reads the state never bundles the SDK.
 * Without an AuthProvider in the tree (the legacy calculator, or sign-in
 * turned off) the state is 'disabled' and saved work stays in this
 * browser.
 *
 * Two states only, decided by the Auth0 session: the provider renders a
 * loading state while Auth0 restores the session, so nothing below it
 * ever sees an in-between state.
 */
export type AuthStatus = 'disabled' | 'signed_out' | 'signed_in';

/** Display details from the Auth0 ID token. */
export interface AuthProfile {
  name: string | null;
  email: string | null;
  picture: string | null;
}

export interface AuthContextValue {
  status: AuthStatus;
  /** From the ID token while signed in; null otherwise. */
  profile: AuthProfile | null;
  /** The Auth0 subject while signed in; scopes cached saved work to the session. */
  subject: string | null;
  /** True when a signed-in session ended because its token could not be renewed. */
  sessionEnded: boolean;
  /** Why the last sign-in did not complete, when it did not. */
  error: Error | null;
  /** Redirects to the hosted sign-in page; returns to `returnTo` (default: here). */
  signIn: (returnTo?: string) => Promise<void>;
  signOut: () => Promise<void>;
  /**
   * An access token for the PolicyEngine API, or null when signed out or
   * the session has just ended. Rejects when sign-in cannot be reached.
   */
  getAccessToken: () => Promise<string | null>;
}

export const DISABLED_AUTH: AuthContextValue = {
  status: 'disabled',
  profile: null,
  subject: null,
  sessionEnded: false,
  error: null,
  signIn: async () => {},
  signOut: async () => {},
  getAccessToken: async () => null,
};

export const AuthContext = createContext<AuthContextValue>(DISABLED_AUTH);

export function useAuthStatus(): AuthContextValue {
  return useContext(AuthContext);
}
