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

export function readPublicApiSettings(
  _environment: EnvironmentVariables,
): PublicApiSettingsResult {
  return { ok: false, problem: "Not implemented yet." };
}
