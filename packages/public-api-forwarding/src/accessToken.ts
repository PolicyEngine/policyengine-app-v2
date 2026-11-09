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

export function createAccessTokenProvider(
  _options: AccessTokenProviderOptions,
): AccessTokenProvider {
  return async () => "";
}
