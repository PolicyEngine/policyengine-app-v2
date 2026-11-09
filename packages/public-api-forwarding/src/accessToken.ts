// Auth0 client-credentials access tokens for the Public API, cached so that
// a deployment requests as few tokens as it can. Auth0 counts the tokens it
// issues per tenant per month, so every token is kept until shortly before
// it expires: first in this instance's memory, then in a cache the
// deployment's instances share (Vercel Runtime Cache).

import type { ServerCredentialSettings } from "./settings";

/** A token is replaced this long before it expires, at most. */
export const TOKEN_REFRESH_MARGIN_SECONDS = 300;

const TOKEN_REQUEST_TIMEOUT_MILLISECONDS = 10_000;

export interface CachedAccessToken {
  readonly accessToken: string;
  /** When to stop using the token, in milliseconds since the epoch. */
  readonly refreshAtMilliseconds: number;
}

/** A cache shared by a deployment's function instances. */
export interface SharedTokenStore {
  get(key: string): Promise<unknown>;
  set(key: string, value: CachedAccessToken, ttlSeconds: number): Promise<void>;
}

export type ForwardingLogger = Pick<Console, "warn" | "error">;

export class AccessTokenError extends Error {
  override name = "AccessTokenError";
}

export interface AccessTokenProviderOptions {
  readonly sharedStore: SharedTokenStore | null;
  readonly fetchImplementation: typeof fetch;
  readonly now: () => number;
  readonly logger: ForwardingLogger;
}

/** Returns a usable access token for the credential, or throws AccessTokenError. */
export type AccessTokenProvider = (
  credential: ServerCredentialSettings,
) => Promise<string>;

function tokenCacheKey(credential: ServerCredentialSettings): string {
  // The client secret is not part of the key, so it never reaches the cache.
  return [
    "public-api-access-token",
    credential.tokenEndpointHost,
    credential.audience,
    credential.clientId,
  ].join(" ");
}

function isCachedAccessToken(value: unknown): value is CachedAccessToken {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.accessToken === "string" &&
    candidate.accessToken.length > 0 &&
    typeof candidate.refreshAtMilliseconds === "number" &&
    Number.isFinite(candidate.refreshAtMilliseconds)
  );
}

export function createAccessTokenProvider(
  options: AccessTokenProviderOptions,
): AccessTokenProvider {
  const rememberedTokens = new Map<string, CachedAccessToken>();
  const pendingRequests = new Map<string, Promise<CachedAccessToken>>();

  const isUsable = (token: CachedAccessToken) =>
    options.now() < token.refreshAtMilliseconds;

  async function readSharedToken(
    cacheKey: string,
  ): Promise<CachedAccessToken | null> {
    if (options.sharedStore === null) {
      return null;
    }
    try {
      const value = await options.sharedStore.get(cacheKey);
      return isCachedAccessToken(value) ? value : null;
    } catch (error) {
      options.logger.warn(
        "Could not read the Public API access token from the shared cache:",
        error instanceof Error ? error.message : error,
      );
      return null;
    }
  }

  async function writeSharedToken(
    cacheKey: string,
    token: CachedAccessToken,
  ): Promise<void> {
    if (options.sharedStore === null) {
      return;
    }
    const ttlSeconds = Math.floor(
      (token.refreshAtMilliseconds - options.now()) / 1000,
    );
    if (ttlSeconds <= 0) {
      return;
    }
    try {
      await options.sharedStore.set(cacheKey, token, ttlSeconds);
    } catch (error) {
      options.logger.warn(
        "Could not store the Public API access token in the shared cache:",
        error instanceof Error ? error.message : error,
      );
    }
  }

  async function requestToken(
    credential: ServerCredentialSettings,
  ): Promise<CachedAccessToken> {
    let response: Response;
    try {
      response = await options.fetchImplementation(
        `https://${credential.tokenEndpointHost}/oauth/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            grant_type: "client_credentials",
            client_id: credential.clientId,
            client_secret: credential.clientSecret,
            audience: credential.audience,
          }),
          signal: AbortSignal.timeout(TOKEN_REQUEST_TIMEOUT_MILLISECONDS),
        },
      );
    } catch (error) {
      throw new AccessTokenError(
        `The Auth0 token request failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    const body: unknown = await response.json().catch(() => null);
    const fields =
      typeof body === "object" && body !== null
        ? (body as Record<string, unknown>)
        : {};

    if (!response.ok) {
      // Auth0's `error` field is a fixed code such as "access_denied".
      const errorCode =
        typeof fields.error === "string" ? ` (${fields.error})` : "";
      throw new AccessTokenError(
        `Auth0 refused the token request with HTTP ${response.status}${errorCode}.`,
      );
    }

    const accessToken = fields.access_token;
    const lifetimeSeconds = fields.expires_in;
    if (
      typeof accessToken !== "string" ||
      accessToken.length === 0 ||
      typeof lifetimeSeconds !== "number" ||
      !Number.isFinite(lifetimeSeconds) ||
      lifetimeSeconds <= 0
    ) {
      throw new AccessTokenError(
        "Auth0's token response has no access token or lifetime.",
      );
    }

    // Stop using the token five minutes before it expires, or halfway
    // through its life if it is shorter than ten minutes.
    const marginSeconds = Math.min(
      TOKEN_REFRESH_MARGIN_SECONDS,
      lifetimeSeconds / 2,
    );
    return {
      accessToken,
      refreshAtMilliseconds:
        options.now() + (lifetimeSeconds - marginSeconds) * 1000,
    };
  }

  async function obtainToken(
    cacheKey: string,
    credential: ServerCredentialSettings,
  ): Promise<CachedAccessToken> {
    const sharedToken = await readSharedToken(cacheKey);
    if (sharedToken !== null && isUsable(sharedToken)) {
      rememberedTokens.set(cacheKey, sharedToken);
      return sharedToken;
    }
    const freshToken = await requestToken(credential);
    rememberedTokens.set(cacheKey, freshToken);
    await writeSharedToken(cacheKey, freshToken);
    return freshToken;
  }

  return async function getAccessToken(credential) {
    const cacheKey = tokenCacheKey(credential);
    const rememberedToken = rememberedTokens.get(cacheKey);
    if (rememberedToken !== undefined && isUsable(rememberedToken)) {
      return rememberedToken.accessToken;
    }

    // Requests that arrive while a token is being fetched wait for it,
    // rather than each asking Auth0 for one.
    let pendingRequest = pendingRequests.get(cacheKey);
    if (pendingRequest === undefined) {
      pendingRequest = obtainToken(cacheKey, credential).finally(() => {
        pendingRequests.delete(cacheKey);
      });
      pendingRequests.set(cacheKey, pendingRequest);
    }
    return (await pendingRequest).accessToken;
  };
}
