import { vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '@/libs/auth/AuthContext';
import { mockMeItem, TEST_ACCESS_TOKEN } from '@/tests/fixtures/api/v2UserMocks';

export const TEST_AUTH0_CONFIG = {
  domain: 'auth.test.policyengine.org',
  clientId: 'test-client-id',
  audience: 'https://api.test.policyengine.org/',
} as const;

/** Stubs the build-time sign-in environment (undo with vi.unstubAllEnvs()). */
export function stubAuthEnv(
  enabled: boolean,
  config: Partial<typeof TEST_AUTH0_CONFIG> = TEST_AUTH0_CONFIG
): void {
  vi.stubEnv('VITE_AUTH_ENABLED', enabled ? 'true' : '');
  vi.stubEnv('VITE_AUTH0_DOMAIN', config.domain ?? '');
  vi.stubEnv('VITE_AUTH0_CLIENT_ID', config.clientId ?? '');
  vi.stubEnv('VITE_AUTH0_AUDIENCE', config.audience ?? '');
}

export function makeAuthValue(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    status: 'anonymous',
    user: null,
    profile: null,
    error: null,
    signIn: vi.fn().mockResolvedValue(undefined),
    signOut: vi.fn().mockResolvedValue(undefined),
    retryAccount: vi.fn(),
    getAccessToken: vi.fn().mockResolvedValue(null),
    ...overrides,
  };
}

/** A signed-in session whose PolicyEngine user has loaded. */
export function signedInAuthValue(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return makeAuthValue({
    status: 'authenticated',
    user: mockMeItem,
    profile: { name: 'Ada Lovelace', email: mockMeItem.email, picture: null },
    getAccessToken: vi.fn().mockResolvedValue(TEST_ACCESS_TOKEN),
    ...overrides,
  });
}

/** Signed in, but the PolicyEngine user could not be loaded. */
export function accountErrorAuthValue(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return makeAuthValue({
    status: 'account_error',
    profile: { name: 'Ada Lovelace', email: mockMeItem.email, picture: null },
    error: new Error('Saved work is temporarily unavailable.'),
    getAccessToken: vi.fn().mockResolvedValue(TEST_ACCESS_TOKEN),
    ...overrides,
  });
}

export function AuthTestProvider({
  value,
  children,
}: {
  value: AuthContextValue;
  children: React.ReactNode;
}) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
