/**
 * Sign-in configuration, read from build-time environment variables.
 *
 * Sign-in is inert unless the deployment sets all of:
 * - VITE_AUTH_ENABLED=true (calculator-app: NEXT_PUBLIC_AUTH_ENABLED)
 * - VITE_AUTH0_DOMAIN, VITE_AUTH0_CLIENT_ID, VITE_AUTH0_AUDIENCE
 *   (calculator-app: NEXT_PUBLIC_AUTH0_*)
 *
 * calculator-app maps the NEXT_PUBLIC_* names onto import.meta.env.VITE_*
 * in next.config.ts, so shared code reads one set of names. Values are
 * read at call time so tests can stub them.
 */

export interface Auth0Config {
  domain: string;
  clientId: string;
  /** The PolicyEngine API resource server; access tokens are minted for it. */
  audience: string;
}

/** Refresh tokens need offline_access; profile and email feed the user menu. */
export const AUTH_SCOPE = 'openid profile email offline_access';

function trimmed(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function isAuthFlagOn(): boolean {
  return trimmed(import.meta.env.VITE_AUTH_ENABLED) === 'true';
}

/** The Auth0 settings, or null when sign-in is off or not fully configured. */
export function getAuth0Config(): Auth0Config | null {
  if (!isAuthFlagOn()) {
    return null;
  }
  const domain = trimmed(import.meta.env.VITE_AUTH0_DOMAIN);
  const clientId = trimmed(import.meta.env.VITE_AUTH0_CLIENT_ID);
  const audience = trimmed(import.meta.env.VITE_AUTH0_AUDIENCE);
  if (!domain || !clientId || !audience) {
    return null;
  }
  return { domain, clientId, audience };
}

/** Where Auth0 sends the browser back to: `/{countryId}/callback`. */
export function callbackPath(countryId: string): string {
  return `/${countryId}/callback`;
}

export function isCallbackPath(pathname: string): boolean {
  return /^\/[a-z]{2}\/callback\/?$/.test(pathname);
}

/**
 * A same-origin path to land on after sign-in. Anything that is not a
 * plain absolute path (another origin, a protocol-relative URL, the
 * callback itself) falls back, so the redirect cannot leave the app.
 */
export function safeReturnTo(returnTo: unknown, fallback: string): string {
  if (typeof returnTo !== 'string' || !returnTo.startsWith('/') || returnTo.startsWith('//')) {
    return fallback;
  }
  if (returnTo.includes('\\')) {
    return fallback;
  }
  const pathname = returnTo.split(/[?#]/)[0];
  if (isCallbackPath(pathname)) {
    return fallback;
  }
  return returnTo;
}
