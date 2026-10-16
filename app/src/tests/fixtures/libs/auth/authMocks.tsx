import { vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '@/libs/auth/AuthContext';
import { TEST_ACCESS_TOKEN } from '@/tests/fixtures/api/v2UserMocks';

export const TEST_AUTH0_CONFIG = {
  domain: 'auth.test.policyengine.org',
  clientId: 'test-client-id',
  audience: 'https://api.test.policyengine.org/',
} as const;

export const TEST_AUTH0_SUBJECT = 'google-oauth2|1234';

export const TEST_PROFILE = {
  name: 'Ada Lovelace',
  email: 'ada@example.org',
  picture: null,
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

/** A signed-out session. */
export function makeAuthValue(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    status: 'signed_out',
    profile: null,
    subject: null,
    sessionEnded: false,
    error: null,
    signIn: vi.fn().mockResolvedValue(undefined),
    signOut: vi.fn().mockResolvedValue(undefined),
    getAccessToken: vi.fn().mockResolvedValue(null),
    ...overrides,
  };
}

/** A signed-in session with a working access token. */
export function signedInAuthValue(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return makeAuthValue({
    status: 'signed_in',
    profile: { ...TEST_PROFILE },
    subject: TEST_AUTH0_SUBJECT,
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
