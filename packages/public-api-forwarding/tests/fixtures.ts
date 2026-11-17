import { vi } from "vitest";

import type { SharedTokenStore } from "../src/accessToken";

export const STAGING_PUBLIC_API_URL = "https://public-api-staging.example.test";
export const TOKEN_ENDPOINT_HOST = "auth.example.test";
export const STAGING_AUDIENCE = "https://staging-api.example.test/";
export const WEBSITE_CLIENT_ID = "website-client-id";
export const WEBSITE_CLIENT_SECRET = "website-client-secret";
export const SERVER_ACCESS_TOKEN = "server-access-token";
export const SECOND_SERVER_ACCESS_TOKEN = "second-server-access-token";
export const USER_ACCESS_TOKEN = "signed-in-user-access-token";
export const UNAUTHENTICATED_USER_ID = "3f2c8b62-4a43-4d4f-9a5c-0d1b8ad8b7e1";
export const BROWSER_ADDRESS = "203.0.113.7";
export const TOKEN_LIFETIME_SECONDS = 86_400;
export const START_TIME_MILLISECONDS = Date.UTC(2026, 10, 9, 12, 0, 0);

export const PREVIEW_ENVIRONMENT_WITHOUT_CREDENTIAL = {
  VERCEL_ENV: "preview",
  POLICYENGINE_API_URL: STAGING_PUBLIC_API_URL,
} as const;

export const PREVIEW_ENVIRONMENT_WITH_CREDENTIAL = {
  ...PREVIEW_ENVIRONMENT_WITHOUT_CREDENTIAL,
  POLICYENGINE_API_AUTH0_DOMAIN: TOKEN_ENDPOINT_HOST,
  POLICYENGINE_API_AUTH0_AUDIENCE: STAGING_AUDIENCE,
  POLICYENGINE_API_AUTH0_CLIENT_ID: WEBSITE_CLIENT_ID,
  POLICYENGINE_API_AUTH0_CLIENT_SECRET: WEBSITE_CLIENT_SECRET,
} as const;

export const WEBSITE_CREDENTIAL = {
  tokenEndpointHost: TOKEN_ENDPOINT_HOST,
  audience: STAGING_AUDIENCE,
  clientId: WEBSITE_CLIENT_ID,
  clientSecret: WEBSITE_CLIENT_SECRET,
} as const;

export function jsonResponse(
  body: unknown,
  statusCode = 200,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

export function tokenResponse(
  accessToken = SERVER_ACCESS_TOKEN,
  lifetimeSeconds = TOKEN_LIFETIME_SECONDS,
): Response {
  return jsonResponse({
    access_token: accessToken,
    expires_in: lifetimeSeconds,
    token_type: "Bearer",
  });
}

export function isTokenRequest(input: RequestInfo | URL): boolean {
  return String(input) === `https://${TOKEN_ENDPOINT_HOST}/oauth/token`;
}

/** A shared store backed by a Map, recording the TTLs it was given. */
export function createFakeSharedStore(): SharedTokenStore & {
  entries: Map<string, unknown>;
  ttlSeconds: number[];
} {
  const entries = new Map<string, unknown>();
  const ttlSeconds: number[] = [];
  return {
    entries,
    ttlSeconds,
    get: vi.fn(async (key: string) => entries.get(key) ?? null),
    set: vi.fn(async (key: string, value: unknown, ttl: number) => {
      entries.set(key, value);
      ttlSeconds.push(ttl);
    }),
  };
}

export const silentLogger = { warn: vi.fn(), error: vi.fn() };
