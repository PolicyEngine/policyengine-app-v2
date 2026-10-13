import { useCallback, useMemo, type ReactNode } from 'react';
import { Auth0Provider, useAuth0, type AppState } from '@auth0/auth0-react';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { fetchMe } from '@/api/v2Me';
import { createV2UserClient } from '@/api/v2UserClient';
import { useCountryContext } from '@/contexts/CountryContext';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { DEFAULT_COUNTRY } from '@/libs/countries';
import { isAssociationCountry, type MeItem } from '@/types/v2User';
import {
  AUTH_SCOPE,
  callbackPath,
  getAuth0Config,
  isCallbackPath,
  safeReturnTo,
  type Auth0Config,
} from './authConfig';
import { AuthContext, authKeys, type AuthContextValue, type AuthStatus } from './AuthContext';
import { clearSignedInSessionData } from './sessionData';

/**
 * Social sign-on for the calculator. With sign-in off (or Auth0 not
 * configured) this renders its children unchanged and the app sees
 * status 'disabled'. Otherwise the browser session is managed by
 * @auth0/auth0-react: tokens stay in memory and are renewed with
 * rotating refresh tokens (falling back to silent re-authentication
 * against the Auth0 custom domain after a reload).
 *
 * Must sit inside the QueryClientProvider, CountryProvider and
 * NavigationProvider.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const config = getAuth0Config();
  if (!config) {
    return <>{children}</>;
  }
  return <Auth0SessionProvider config={config}>{children}</Auth0SessionProvider>;
}

let redirectHandled = false;

/** Whether this page load has already finished a sign-in redirect. */
export function wasSignInRedirectHandled(): boolean {
  return redirectHandled;
}

function Auth0SessionProvider({ config, children }: { config: Auth0Config; children: ReactNode }) {
  const countryId = useCountryContext() ?? DEFAULT_COUNTRY;
  const nav = useAppNavigate();
  const inBrowser = typeof window !== 'undefined';

  const onRedirectCallback = useCallback(
    (appState?: AppState) => {
      redirectHandled = true;
      nav.replace(safeReturnTo(appState?.returnTo, `/${countryId}`));
    },
    [nav, countryId]
  );

  return (
    <Auth0Provider
      domain={config.domain}
      clientId={config.clientId}
      cacheLocation="memory"
      useRefreshTokens
      useRefreshTokensFallback
      // Only the callback route consumes ?code&state; other pages may carry
      // their own query parameters.
      skipRedirectCallback={!inBrowser || !isCallbackPath(window.location.pathname)}
      onRedirectCallback={onRedirectCallback}
      authorizationParams={{
        audience: config.audience,
        redirect_uri: inBrowser ? `${window.location.origin}${callbackPath(countryId)}` : undefined,
        scope: AUTH_SCOPE,
      }}
    >
      <Auth0SessionBridge config={config} countryId={countryId}>
        {children}
      </Auth0SessionBridge>
    </Auth0Provider>
  );
}

function stringClaim(value: unknown): string | null {
  return typeof value === 'string' && value ? value : null;
}

/** Attempts after the first before the PolicyEngine user counts as unavailable. */
export const ME_RETRIES = 3;

/** 1s, 2s, 4s between attempts (capped at 8s). */
export function meRetryDelay(attempt: number): number {
  return Math.min(1000 * 2 ** attempt, 8000);
}

const MISSING_SUBJECT_MESSAGE = 'The sign-in session did not identify a user.';

/**
 * Where the session stands. In the US and UK a signed-in session is only
 * 'authenticated' once its PolicyEngine user has loaded; while that is
 * in flight (retries included) it is 'loading', and once it has failed
 * it is 'account_error'.
 */
export function sessionStatus({
  isLoading,
  isAuthenticated,
  hasSubject,
  meCountry,
  me,
}: {
  isLoading: boolean;
  isAuthenticated: boolean;
  hasSubject: boolean;
  meCountry: string | null;
  me: Pick<UseQueryResult<MeItem, Error>, 'data' | 'isError'>;
}): AuthStatus {
  if (isLoading) {
    return 'loading';
  }
  if (!isAuthenticated) {
    return 'anonymous';
  }
  if (!meCountry || me.data) {
    return 'authenticated';
  }
  if (!hasSubject || me.isError) {
    return 'account_error';
  }
  return 'loading';
}

function Auth0SessionBridge({
  config,
  countryId,
  children,
}: {
  config: Auth0Config;
  countryId: string;
  children: ReactNode;
}) {
  const {
    isLoading,
    isAuthenticated,
    error: auth0Error,
    user: auth0User,
    getAccessTokenSilently,
    loginWithRedirect,
    logout,
  } = useAuth0();

  const getAccessToken = useCallback(async () => {
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: config.audience },
      });
      return token || null;
    } catch {
      return null;
    }
  }, [getAccessTokenSilently, config.audience]);

  const subject = stringClaim(auth0User?.sub);
  const name = stringClaim(auth0User?.name);
  const email = stringClaim(auth0User?.email);
  const picture = stringClaim(auth0User?.picture);

  // The PolicyEngine user behind the session. Fetched with the current
  // country (us/uk) so a first sign-in provisions with it; elsewhere the
  // session is still signed in but saved work stays local. Until it
  // loads, saved work has nowhere to go, so a failure keeps retrying:
  // with backoff at first, then whenever the window regains focus or
  // the network comes back (and on retryAccount).
  const meCountry = isAssociationCountry(countryId) ? countryId : null;
  const meQuery = useQuery<MeItem, Error>({
    queryKey: authKeys.me(subject ?? ''),
    queryFn: () => fetchMe(createV2UserClient({ getAccessToken }), meCountry!),
    enabled: isAuthenticated && !!subject && !!meCountry,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: ME_RETRIES,
    retryDelay: meRetryDelay,
    refetchOnWindowFocus: (query) => query.state.status === 'error',
    refetchOnReconnect: (query) => query.state.status === 'error',
  });

  const status = sessionStatus({
    isLoading,
    isAuthenticated,
    hasSubject: !!subject,
    meCountry,
    me: meQuery,
  });

  const user = isAuthenticated ? (meQuery.data ?? null) : null;
  const accountError =
    status === 'account_error' ? (meQuery.error ?? new Error(MISSING_SUBJECT_MESSAGE)) : null;
  const error = auth0Error ?? accountError;

  const { refetch: refetchMe } = meQuery;
  const retryAccount = useCallback(() => {
    void refetchMe();
  }, [refetchMe]);

  const signIn = useCallback(
    async (returnTo?: string) => {
      const here =
        typeof window !== 'undefined'
          ? `${window.location.pathname}${window.location.search}`
          : `/${countryId}`;
      await loginWithRedirect({
        appState: { returnTo: safeReturnTo(returnTo ?? here, `/${countryId}`) },
        authorizationParams: {
          audience: config.audience,
          redirect_uri: `${window.location.origin}${callbackPath(countryId)}`,
          scope: AUTH_SCOPE,
        },
      });
    },
    [loginWithRedirect, countryId, config.audience]
  );

  const signOut = useCallback(async () => {
    clearSignedInSessionData();
    await logout({ logoutParams: { returnTo: `${window.location.origin}/${countryId}` } });
  }, [logout, countryId]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      profile: isAuthenticated ? { name, email, picture } : null,
      error,
      signIn,
      signOut,
      retryAccount,
      getAccessToken,
    }),
    [
      status,
      user,
      isAuthenticated,
      name,
      email,
      picture,
      error,
      signIn,
      signOut,
      retryAccount,
      getAccessToken,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
