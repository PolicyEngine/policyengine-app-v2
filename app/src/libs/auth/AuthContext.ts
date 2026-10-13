import { createContext, useCallback, useContext, useEffect, useRef } from 'react';
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

/** The session once it has been restored. */
export interface SettledSession {
  status: Exclude<AuthStatus, 'loading'>;
  user: MeItem | null;
}

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
  /**
   * The session as soon as it is restored: at once when it already is,
   * otherwise when status leaves 'loading'. Saved-work writes wait on it
   * so they never go to this browser for a user who is signing in.
   */
  settledSession: () => Promise<SettledSession>;
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
  settledSession: async () => ({ status: 'disabled', user: null }),
  getAccessToken: async () => null,
};

export const AuthContext = createContext<AuthContextValue>(DISABLED_AUTH);

export function useAuthStatus(): AuthContextValue {
  return useContext(AuthContext);
}

interface SessionWaiter {
  resolve: (session: SettledSession) => void;
  reject: (error: Error) => void;
}

/** What a wait for the session fails with when its provider goes away first. */
export class SessionClosedError extends Error {
  constructor() {
    super(
      'Sign-in was interrupted before your session was restored, so nothing was saved. Try again.'
    );
    this.name = 'SessionClosedError';
  }
}

/**
 * `settledSession` for a provider whose state is `status` and `user`:
 * callers that ask while the session is loading are answered once it has
 * been restored, with the state it settled in.
 */
export function useSettledSession(
  status: AuthStatus,
  user: MeItem | null
): () => Promise<SettledSession> {
  const latest = useRef({ status, user });
  latest.current = { status, user };
  const waiting = useRef<SessionWaiter[]>([]);

  useEffect(() => {
    if (status === 'loading') {
      return;
    }
    const answered = waiting.current.splice(0);
    answered.forEach((waiter) => waiter.resolve({ status, user }));
  }, [status, user]);

  // A provider that goes away mid-restore (e.g. a country switch remounts
  // it) can never answer: its waiters fail instead of hanging forever.
  useEffect(
    () => () => {
      const abandoned = waiting.current.splice(0);
      abandoned.forEach((waiter) => waiter.reject(new SessionClosedError()));
    },
    []
  );

  return useCallback(() => {
    const session = latest.current;
    if (session.status === 'loading') {
      return new Promise<SettledSession>((resolve, reject) =>
        waiting.current.push({ resolve, reject })
      );
    }
    return Promise.resolve({ status: session.status, user: session.user });
  }, []);
}

export const authKeys = {
  all: ['auth'] as const,
  me: (subject: string) => ['auth', 'me', subject] as const,
};
