import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { CountryProvider } from '@/contexts/CountryContext';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { useAuthStatus } from '@/libs/auth/AuthContext';
import { AuthProvider, ME_RETRIES } from '@/libs/auth/AuthProvider';
import type { CountryId } from '@/libs/countries';
import {
  errorResponse,
  itemResponse,
  mockMeItem,
  TEST_ACCESS_TOKEN,
} from '@/tests/fixtures/api/v2UserMocks';
import { stubAuthEnv, TEST_AUTH0_CONFIG } from '@/tests/fixtures/libs/auth/authMocks';

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

const navigation = { push: vi.fn(), replace: vi.fn(), back: vi.fn() };
const fetchMock = vi.fn();

function Probe() {
  const auth = useAuthStatus();
  return (
    <div>
      <span data-testid="status">{auth.status}</span>
      <span data-testid="user">{auth.user?.id ?? 'none'}</span>
      <span data-testid="error">{auth.error?.message ?? 'none'}</span>
      <button type="button" onClick={() => auth.signIn('/us/reforms?filter=yours')}>
        Sign in
      </button>
      <button type="button" onClick={() => auth.retryAccount()}>
        Retry
      </button>
    </div>
  );
}

function renderProvider(countryId: CountryId = 'us') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <CountryProvider value={countryId}>
        <NavigationProvider value={navigation}>
          <AuthProvider>
            <Probe />
          </AuthProvider>
        </NavigationProvider>
      </CountryProvider>
    </QueryClientProvider>
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

  test('given the session is being restored then status is loading', () => {
    // Given
    stubAuthEnv(true);
    auth0.state.isLoading = true;

    // When
    renderProvider();

    // Then
    expect(screen.getByTestId('status')).toHaveTextContent('loading');
  });

  test('given no session then status is anonymous', () => {
    // Given
    stubAuthEnv(true);

    // When
    renderProvider();

    // Then
    expect(screen.getByTestId('status')).toHaveTextContent('anonymous');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('given a session in the US then /v2/me loads the PolicyEngine user with the bearer token', async () => {
    // Given
    stubAuthEnv(true);
    auth0.state.isAuthenticated = true;
    auth0.state.user = { sub: 'google-oauth2|1234', email: mockMeItem.email };
    fetchMock.mockResolvedValue(itemResponse(mockMeItem));

    // When
    renderProvider('us');

    // Then
    expect(screen.getByTestId('status')).toHaveTextContent('loading');
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));
    expect(screen.getByTestId('user')).toHaveTextContent(mockMeItem.id);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.policyengine.org/v2/me?country_id=us');
    expect(init.headers.Authorization).toBe(`Bearer ${TEST_ACCESS_TOKEN}`);
    expect(auth0.getAccessTokenSilently).toHaveBeenCalledWith({
      authorizationParams: { audience: TEST_AUTH0_CONFIG.audience },
    });
  });

  test('given /v2/me keeps failing then the session reports an account error, not a signed-in user', async () => {
    // Given
    vi.useFakeTimers({ shouldAdvanceTime: true });
    stubAuthEnv(true);
    auth0.state.isAuthenticated = true;
    auth0.state.user = { sub: 'google-oauth2|1234' };
    fetchMock.mockImplementation(async () => errorResponse(503, 'Database unavailable'));

    // When
    renderProvider('uk');
    expect(screen.getByTestId('status')).toHaveTextContent('loading');
    await vi.advanceTimersByTimeAsync(10_000);

    // Then: every retry was spent before giving up
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('account_error'));
    expect(fetchMock).toHaveBeenCalledTimes(1 + ME_RETRIES);
    expect(screen.getByTestId('user')).toHaveTextContent('none');
    expect(screen.getByTestId('error')).toHaveTextContent('Database unavailable');
    vi.useRealTimers();
  });

  test('given an account error then retrying loads the PolicyEngine user', async () => {
    // Given
    vi.useFakeTimers({ shouldAdvanceTime: true });
    stubAuthEnv(true);
    auth0.state.isAuthenticated = true;
    auth0.state.user = { sub: 'google-oauth2|1234' };
    fetchMock.mockImplementation(async () => errorResponse(503, 'Database unavailable'));
    renderProvider('us');
    await vi.advanceTimersByTimeAsync(10_000);
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('account_error'));
    vi.useRealTimers();

    // When
    fetchMock.mockImplementation(async () => itemResponse(mockMeItem));
    await userEvent.setup().click(screen.getByRole('button', { name: 'Retry' }));

    // Then
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));
    expect(screen.getByTestId('user')).toHaveTextContent(mockMeItem.id);
    expect(screen.getByTestId('error')).toHaveTextContent('none');
  });

  test('given a session in a country without account storage then /v2/me is not called', () => {
    // Given
    stubAuthEnv(true);
    auth0.state.isAuthenticated = true;
    auth0.state.user = { sub: 'google-oauth2|1234' };

    // When
    renderProvider('ca');

    // Then
    expect(screen.getByTestId('status')).toHaveTextContent('authenticated');
    expect(screen.getByTestId('user')).toHaveTextContent('none');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('given sign in then the redirect returns to the requested page via the country callback', async () => {
    // Given
    stubAuthEnv(true);
    renderProvider('us');

    // When
    screen.getByRole('button', { name: 'Sign in' }).click();

    // Then
    await waitFor(() =>
      expect(auth0.loginWithRedirect).toHaveBeenCalledWith({
        appState: { returnTo: '/us/reforms?filter=yours' },
        authorizationParams: {
          audience: TEST_AUTH0_CONFIG.audience,
          redirect_uri: `${window.location.origin}/us/callback`,
          scope: 'openid profile email offline_access',
        },
      })
    );
  });

  test('given the redirect completes then it navigates to the saved return path', () => {
    // Given
    stubAuthEnv(true);
    renderProvider('us');
    const { onRedirectCallback } = auth0.providerProps.mock.calls[0][0];

    // When
    onRedirectCallback({ returnTo: '/us/build' });
    onRedirectCallback({ returnTo: 'https://evil.example/' });

    // Then
    expect(navigation.replace).toHaveBeenNthCalledWith(1, '/us/build');
    expect(navigation.replace).toHaveBeenNthCalledWith(2, '/us');
  });
});
