// Which Public API deployment a route handler calls, and the server
// credential it sends, read from the deployment's environment variables.

export const PRODUCTION_PUBLIC_API_URL = "https://api.policyengine.org";

export const PUBLIC_API_URL_VARIABLE = "POLICYENGINE_API_URL";

export const CREDENTIAL_VARIABLES = {
  tokenEndpointHost: "POLICYENGINE_API_AUTH0_DOMAIN",
  audience: "POLICYENGINE_API_AUTH0_AUDIENCE",
  clientId: "POLICYENGINE_API_AUTH0_CLIENT_ID",
  clientSecret: "POLICYENGINE_API_AUTH0_CLIENT_SECRET",
} as const;

export type EnvironmentVariables = Readonly<Record<string, string | undefined>>;

/** An Auth0 machine-to-machine client, used for client-credentials tokens. */
export interface ServerCredentialSettings {
  /** Host name of the Auth0 tenant's token endpoint. */
  readonly tokenEndpointHost: string;
  readonly audience: string;
  readonly clientId: string;
  readonly clientSecret: string;
}

export interface PublicApiSettings {
  /** The Public API's origin, plus any base path, with no trailing slash. */
  readonly baseUrl: string;
  /** Null when no credential is configured; requests then go without one. */
  readonly credential: ServerCredentialSettings | null;
}

export type PublicApiSettingsResult =
  | { readonly ok: true; readonly settings: PublicApiSettings }
  | { readonly ok: false; readonly problem: string };

const LOCAL_HOST_NAMES = new Set(["localhost", "127.0.0.1", "[::1]"]);
const HOST_NAME_PATTERN = /^[a-z0-9.-]+$/i;

function setValue(
  environment: EnvironmentVariables,
  name: string,
): string | undefined {
  const value = environment[name]?.trim();
  return value ? value : undefined;
}

function readBaseUrl(
  environment: EnvironmentVariables,
): { ok: true; baseUrl: string } | { ok: false; problem: string } {
  const configuredUrl = setValue(environment, PUBLIC_API_URL_VARIABLE);
  if (configuredUrl === undefined) {
    // Only a production deployment may fall back to the production Public
    // API. Preview and development deployments must name the staging
    // service, so a preview never reaches production by omission.
    if (environment.VERCEL_ENV === "production") {
      return { ok: true, baseUrl: PRODUCTION_PUBLIC_API_URL };
    }
    return {
      ok: false,
      problem: `${PUBLIC_API_URL_VARIABLE} is not set. Only production deployments default to ${PRODUCTION_PUBLIC_API_URL}.`,
    };
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(configuredUrl);
  } catch {
    return {
      ok: false,
      problem: `${PUBLIC_API_URL_VARIABLE} is not a URL.`,
    };
  }
  const isLocalHttp =
    parsedUrl.protocol === "http:" && LOCAL_HOST_NAMES.has(parsedUrl.hostname);
  if (parsedUrl.protocol !== "https:" && !isLocalHttp) {
    return {
      ok: false,
      problem: `${PUBLIC_API_URL_VARIABLE} must be an https URL.`,
    };
  }
  if (
    parsedUrl.search ||
    parsedUrl.hash ||
    parsedUrl.username ||
    parsedUrl.password
  ) {
    return {
      ok: false,
      problem: `${PUBLIC_API_URL_VARIABLE} must not carry a query, fragment or user name.`,
    };
  }
  if (
    environment.VERCEL_ENV !== "production" &&
    parsedUrl.origin === new URL(PRODUCTION_PUBLIC_API_URL).origin
  ) {
    return {
      ok: false,
      problem: `${PUBLIC_API_URL_VARIABLE} names the production Public API, which only production deployments may call.`,
    };
  }
  return {
    ok: true,
    baseUrl: `${parsedUrl.origin}${parsedUrl.pathname.replace(/\/+$/, "")}`,
  };
}

function readCredential(
  environment: EnvironmentVariables,
):
  | { ok: true; credential: ServerCredentialSettings | null }
  | { ok: false; problem: string } {
  const entries = Object.entries(CREDENTIAL_VARIABLES).map(
    ([field, variableName]) =>
      [field, variableName, setValue(environment, variableName)] as const,
  );
  const missingNames = entries
    .filter(([, , value]) => value === undefined)
    .map(([, variableName]) => variableName);

  if (missingNames.length === entries.length) {
    return { ok: true, credential: null };
  }
  if (missingNames.length > 0) {
    return {
      ok: false,
      problem: `The server credential is only partly configured; set ${missingNames.join(", ")} or unset the others.`,
    };
  }

  const values = Object.fromEntries(
    entries.map(([field, , value]) => [field, value as string]),
  ) as Record<keyof typeof CREDENTIAL_VARIABLES, string>;

  // Accept "auth.example.org", "https://auth.example.org" or with a
  // trailing slash, and keep only the host name.
  const tokenEndpointHost = values.tokenEndpointHost
    .replace(/^https:\/\//i, "")
    .replace(/\/+$/, "");
  if (!HOST_NAME_PATTERN.test(tokenEndpointHost)) {
    return {
      ok: false,
      problem: `${CREDENTIAL_VARIABLES.tokenEndpointHost} must be a host name, such as an Auth0 custom domain.`,
    };
  }

  return {
    ok: true,
    credential: {
      tokenEndpointHost,
      audience: values.audience,
      clientId: values.clientId,
      clientSecret: values.clientSecret,
    },
  };
}

/**
 * Reads the Public API's address and the server credential.
 *
 * - `POLICYENGINE_API_URL` names the Public API. A production deployment
 *   (`VERCEL_ENV=production`) without it uses https://api.policyengine.org;
 *   any other deployment without it, or naming the production Public API,
 *   is refused.
 * - The four `POLICYENGINE_API_AUTH0_*` variables name an Auth0 client. With
 *   none of them set, requests go without a server credential; with only
 *   some set, the settings are refused.
 */
export function readPublicApiSettings(
  environment: EnvironmentVariables,
): PublicApiSettingsResult {
  const baseUrlResult = readBaseUrl(environment);
  if (!baseUrlResult.ok) {
    return baseUrlResult;
  }
  const credentialResult = readCredential(environment);
  if (!credentialResult.ok) {
    return credentialResult;
  }
  return {
    ok: true,
    settings: {
      baseUrl: baseUrlResult.baseUrl,
      credential: credentialResult.credential,
    },
  };
}
