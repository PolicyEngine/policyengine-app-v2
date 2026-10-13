import { useState } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { FlagshipReportStore } from '@/api/flagshipReportStore';
import { CountryProvider } from '@/contexts/CountryContext';
import { useAuthStatus } from '@/libs/auth/AuthContext';
import { AuthProvider, takeSignInReturnTo } from '@/libs/auth/AuthProvider';
import type { CountryId } from '@/libs/countries';
import { getDraftReform, startDraftReform } from '@/libs/draftReform';
import { readReportMeta, runFlagshipReport } from '@/libs/flagship/runReport';
import { TEST_ACCESS_TOKEN } from '@/tests/fixtures/api/v2UserMocks';
import {
  stubAuthEnv,
  TEST_AUTH0_CONFIG,
  TEST_AUTH0_SUBJECT,
  TEST_PROFILE,
} from '@/tests/fixtures/libs/auth/authMocks';

const auth0 = vi.hoisted(() => ({
  state: {
    isLoading: false,
    isAuthenticated: false,
    error: undefined as Error | undefined,
    user: undefined as Record<string, unknown> | undefined,
  },
  providerProps: vi.fn(),
  getAccessTokenSilently: vi.fn(),
  loginWithRedirect: vi.fn(),
  logout: vi.fn(),
}));

vi.mock('@auth0/auth0-react', () => ({
  Auth0Provider: (props: { children: React.ReactNode }) => {
    auth0.providerProps(props);
    return <>{props.children}</>;
  },
  useAuth0: () => ({
    ...auth0.state,
    getAccessTokenSilently: auth0.getAccessTokenSilently,
    loginWithRedirect: auth0.loginWithRedirect,
    logout: auth0.logout,
  }),
}));

const mockCreateReport = vi.hoisted(() => vi.fn());

vi.mock('@/api/policy', () => ({
  createPolicy: vi.fn().mockResolvedValue({ result: { policy_id: '77' } }),
}));
vi.mock('@/api/simulation', () => ({
  createSimulation: vi.fn().mockResolvedValue({ result: { simulation_id: '101' } }),
}));
vi.mock('@/api/report', () => ({
  createReport: mockCreateReport,
}));

const fetchMock = vi.fn();

function Probe() {
  const auth = useAuthStatus();
  const [token, setToken] = useState('');
  return (
    <div>
      <span data-testid="status">{auth.status}</span>
      <span data-testid="subject">{auth.subject ?? 'none'}</span>
      <span data-testid="name">{auth.profile?.name ?? 'none'}</span>
      <span data-testid="session-ended">{String(auth.sessionEnded)}</span>
      <span data-testid="token">{token}</span>
      <button type="button" onClick={() => auth.signIn('/us/reforms?filter=yours')}>
        Sign in
      </button>
      <button type="button" onClick={() => auth.signOut()}>
        Sign out
      </button>
      <button
        type="button"
        onClick={async () => setToken((await auth.getAccessToken()) ?? 'no token')}
      >
        Get token
      </button>
    </div>
  );
}

function renderProvider(countryId: CountryId = 'us') {
  return render(
    <CountryProvider value={countryId}>
      <AuthProvider>
        <Probe />
      </AuthProvider>
    </CountryProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
  auth0.state.isLoading = false;
  auth0.state.isAuthenticated = false;
  auth0.state.error = undefined;
  auth0.state.user = undefined;
  auth0.getAccessTokenSilently.mockResolvedValue(TEST_ACCESS_TOKEN);
  auth0.logout.mockImplementation(async () => {
    auth0.state.isAuthenticated = false;
    auth0.state.user = undefined;
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('AuthProvider', () => {
  test('given sign-in is off then children render with status disabled and no Auth0', () => {
    // Given
    stubAuthEnv(false);

    // When
    renderProvider();

    // Then
    expect(screen.getByTestId('status')).toHaveTextContent('disabled');
    expect(auth0.providerProps).not.toHaveBeenCalled();
  });

  test('given the flag is on but Auth0 is not configured then sign-in stays disabled', () => {
    // Given
    stubAuthEnv(true, { domain: TEST_AUTH0_CONFIG.domain });

    // When
    renderProvider();

    // Then
    expect(screen.getByTestId('status')).toHaveTextContent('disabled');
    expect(auth0.providerProps).not.toHaveBeenCalled();
  });

  test('given sign-in is on then Auth0 keeps tokens in memory with rotating refresh tokens', () => {
    // Given
    stubAuthEnv(true);

    // When
    renderProvider('uk');

    // Then
    expect(auth0.providerProps).toHaveBeenCalledWith(
      expect.objectContaining({
        domain: TEST_AUTH0_CONFIG.domain,
        clientId: TEST_AUTH0_CONFIG.clientId,
        cacheLocation: 'memory',
        useRefreshTokens: true,
        useRefreshTokensFallback: true,
        authorizationParams: {
          audience: TEST_AUTH0_CONFIG.audience,
          redirect_uri: `${window.location.origin}/uk/callback`,
          scope: 'openid profile email offline_access',
        },
      })
    );
  });

  test('given Auth0 is restoring the session then a loading state renders instead of the workspace', () => {
    // Given
    stubAuthEnv(true);
    auth0.state.isLoading = true;

    // When
    renderProvider();

    // Then
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    expect(screen.queryByTestId('status')).not.toBeInTheDocument();
  });

  test('given no session then the workspace is signed out', () => {
    // Given
    stubAuthEnv(true);

    // When
    renderProvider();

    // Then
    expect(screen.getByTestId('status')).toHaveTextContent('signed_out');
    expect(screen.getByTestId('subject')).toHaveTextContent('none');
  });

  test('given a session then it is signed in, with its identity from the ID token and no /v2/me call', () => {
    // Given
    stubAuthEnv(true);
    auth0.state.isAuthenticated = true;
    auth0.state.user = { sub: TEST_AUTH0_SUBJECT, ...TEST_PROFILE };

    // When
    renderProvider();

    // Then
    expect(screen.getByTestId('status')).toHaveTextContent('signed_in');
    expect(screen.getByTestId('subject')).toHaveTextContent(TEST_AUTH0_SUBJECT);
    expect(screen.getByTestId('name')).toHaveTextContent(TEST_PROFILE.name);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('given a token that can no longer be renewed then the session ends and invites sign-in', async () => {
    // Given
    stubAuthEnv(true);
    auth0.state.isAuthenticated = true;
    auth0.state.user = { sub: TEST_AUTH0_SUBJECT };
    auth0.getAccessTokenSilently.mockRejectedValue({ error: 'login_required' });
    renderProvider();

    // When
    await userEvent.setup().click(screen.getByRole('button', { name: 'Get token' }));

    // Then
    expect(auth0.logout).toHaveBeenCalledWith({ openUrl: false });
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('signed_out'));
    expect(screen.getByTestId('session-ended')).toHaveTextContent('true');
    expect(screen.getByTestId('token')).toHaveTextContent('no token');
  });

  test('given a token request that fails for another reason then the session stays signed in', async () => {
    // Given
    stubAuthEnv(true);
    auth0.state.isAuthenticated = true;
    auth0.state.user = { sub: TEST_AUTH0_SUBJECT };
    auth0.getAccessTokenSilently.mockRejectedValue({ error: 'timeout' });
    renderProvider();

    // When
    await userEvent.setup().click(screen.getByRole('button', { name: 'Get token' }));

    // Then
    await waitFor(() => expect(screen.getByTestId('token')).toHaveTextContent('no token'));
    expect(auth0.logout).not.toHaveBeenCalled();
    expect(screen.getByTestId('status')).toHaveTextContent('signed_in');
  });

  test('given sign in then the redirect returns to the requested page via the country callback', async () => {
    // Given
    stubAuthEnv(true);
    renderProvider('us');

    // When
    await userEvent.setup().click(screen.getByRole('button', { name: 'Sign in' }));

    // Then
    expect(auth0.loginWithRedirect).toHaveBeenCalledWith({
      appState: { returnTo: '/us/reforms?filter=yours' },
      authorizationParams: {
        audience: TEST_AUTH0_CONFIG.audience,
        redirect_uri: `${window.location.origin}/us/callback`,
        scope: 'openid profile email offline_access',
      },
    });
  });

  test('given the redirect completes then the callback can read where sign-in started, once', () => {
    // Given
    stubAuthEnv(true);
    renderProvider('us');
    const { onRedirectCallback } = auth0.providerProps.mock.calls[0][0];

    // When
    act(() => onRedirectCallback({ returnTo: '/us/build' }));

    // Then
    expect(takeSignInReturnTo()).toBe('/us/build');
    expect(takeSignInReturnTo()).toBeNull();
    act(() => onRedirectCallback({ returnTo: 'https://evil.example/' }));
    expect(takeSignInReturnTo()).toBe('/us');
  });

  test('given sign out then what the session left in this browser is cleared first', async () => {
    // Given: a signed-in run's provenance and an account reform loaded for editing
    stubAuthEnv(true);
    auth0.state.isAuthenticated = true;
    auth0.state.user = { sub: TEST_AUTH0_SUBJECT };
    mockCreateReport.mockResolvedValue({ id: 56 });
    await runFlagshipReport({
      countryId: 'us',
      title: 'CTC expansion',
      sourceNote: '',
      provisions: [{ path: 'gov.x', breadcrumb: 'X', unit: null, baselineValue: 1, value: 2 }],
      currentLawId: 2,
      accountReportStore: {
        create: vi.fn().mockResolvedValue({}),
      } as unknown as FlagshipReportStore,
    });
    startDraftReform('us', 'manual');
    renderProvider('us');

    // When
    await userEvent.setup().click(screen.getByRole('button', { name: 'Sign out' }));

    // Then
    expect(readReportMeta('56')).toBeNull();
    expect(getDraftReform()).toBeNull();
    expect(auth0.logout).toHaveBeenCalledWith({
      logoutParams: { returnTo: `${window.location.origin}/us` },
    });
  });
});
