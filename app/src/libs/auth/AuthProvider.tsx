import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Auth0Provider, useAuth0, type AppState } from '@auth0/auth0-react';
import { Spinner, Stack, Text } from '@/components/ui';
import { useCountryContext } from '@/contexts/CountryContext';
import { colors, spacing } from '@/designTokens';
import { DEFAULT_COUNTRY } from '@/libs/countries';
import {
  AUTH_SCOPE,
  callbackPath,
  getAuth0Config,
  isCallbackPath,
  safeReturnTo,
  type Auth0Config,
} from './authConfig';
import { AuthContext, type AuthContextValue } from './AuthContext';
import { clearSignedInSessionData } from './sessionData';

/**
 * Social sign-on for the v3 workspace. With sign-in off (or Auth0 not
 * configured) this renders its children unchanged and the workspace sees
 * status 'disabled'. Otherwise the browser session is managed by
 * @auth0/auth0-react: tokens stay in memory and are renewed with rotating
 * refresh tokens (falling back to silent re-authentication against the
 * Auth0 custom domain after a reload).
 *
 * While Auth0 restores the session the provider renders a loading state
 * instead of its children, so the workspace only ever sees signed in or
 * signed out.
 *
 * Must sit inside the CountryProvider.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const config = getAuth0Config();
  if (!config) {
    return <>{children}</>;
  }
  return <Auth0SessionProvider config={config}>{children}</Auth0SessionProvider>;
}

let signInReturnTo: string | null = null;

/**
 * Where the sign-in that just completed started, once per sign-in. The
 * callback page reads it to navigate on after setting up the account.
 */
export function takeSignInReturnTo(): string | null {
  const returnTo = signInReturnTo;
  signInReturnTo = null;
  return returnTo;
}

function Auth0SessionProvider({ config, children }: { config: Auth0Config; children: ReactNode }) {
  const countryId = useCountryContext() ?? DEFAULT_COUNTRY;
  const inBrowser = typeof window !== 'undefined';

  const onRedirectCallback = useCallback(
    (appState?: AppState) => {
      signInReturnTo = safeReturnTo(appState?.returnTo, `/${countryId}`);
    },
    [countryId]
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

/** Auth0 errors meaning the session cannot be renewed without signing in again. */
const SESSION_ENDED_ERRORS = new Set([
  'login_required',
  'consent_required',
  'interaction_required',
  'missing_refresh_token',
  'invalid_grant',
]);

export function isSessionEndedError(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('error' in error)) {
    return false;
  }
  return SESSION_ENDED_ERRORS.has(String(error.error));
}

/** Shown in place of the workspace while Auth0 restores the session. */
export function SessionRestoring() {
  return (
    <Stack
      role="status"
      aria-live="polite"
      style={{ padding: spacing['3xl'], gap: spacing.md, alignItems: 'center' }}
    >
      <Spinner size="sm" />
      <Text style={{ margin: 0, color: colors.text.secondary }}>Loading…</Text>
    </Stack>
  );
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
    error,
    user,
    getAccessTokenSilently,
    loginWithRedirect,
    logout,
  } = useAuth0();
  const [sessionEnded, setSessionEnded] = useState(false);

  // A token that cannot be renewed ends the session: the user is signed
  // out here (without a redirect) and invited to sign in again.
  const getAccessToken = useCallback(async () => {
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: config.audience },
      });
      return token || null;
    } catch (caught) {
      if (isSessionEndedError(caught)) {
        setSessionEnded(true);
        clearSignedInSessionData();
        await logout({ openUrl: false });
      }
      return null;
    }
  }, [getAccessTokenSilently, config.audience, logout]);

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

  const subject = isAuthenticated ? stringClaim(user?.sub) : null;
  const name = stringClaim(user?.name);
  const email = stringClaim(user?.email);
  const picture = stringClaim(user?.picture);

  const value = useMemo<AuthContextValue>(
    () => ({
      status: isAuthenticated ? 'signed_in' : 'signed_out',
      profile: isAuthenticated ? { name, email, picture } : null,
      subject,
      sessionEnded: !isAuthenticated && sessionEnded,
      error: error ?? null,
      signIn,
      signOut,
      getAccessToken,
    }),
    [
      isAuthenticated,
      name,
      email,
      picture,
      subject,
      sessionEnded,
      error,
      signIn,
      signOut,
      getAccessToken,
    ]
  );

  if (isLoading) {
    return <SessionRestoring />;
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
