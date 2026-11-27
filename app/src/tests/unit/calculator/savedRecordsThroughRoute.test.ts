// @vitest-environment node
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { AccountAssociationRoutes } from '@/api/v2Associations';
import { exportMe, fetchMe, upgradeAccount } from '@/api/v2Me';
import { createV2UserClient, type V2Credentials } from '@/api/v2UserClient';
import * as publicApiRoute from '../../../../../calculator-app/src/app/api/policyengine/[...path]/route';

const APP_URL = 'https://app.policyengine.org';
const STAGING_PUBLIC_API_URL = 'https://public-api-staging.example.test';
const TOKEN_ENDPOINT = 'https://auth.example.test/oauth/token';
const CALCULATOR_SERVER_TOKEN = 'calculator-server-token';
const USER_ACCESS_TOKEN = 'signed-in-user-access-token';
const BROWSER_USER_ID = '3f2c8b62-4a43-4d4f-9a5c-0d1b8ad8b7e1';
const SAVED_RECORD_ID = '9b0e4c1a-2f3d-4e5f-8a6b-7c8d9e0f1a2b';
const SAVED_ITEM = { id: SAVED_RECORD_ID, country_id: 'us', label: 'Saved' };
/** One answer fits every saved-record route: an item, or a page of one. */
const SAVED_RECORD_ANSWER = {
  status: 'ok',
  message: null,
  result: { item: SAVED_ITEM, items: [SAVED_ITEM], total: 1 },
};

type RouteMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

interface ForwardedRequest {
  readonly url: string;
  readonly method: string;
  readonly headers: Headers;
}

const upstreamFetch = vi.fn<typeof fetch>();
/** Requests the browser sent anywhere but the calculator's own route. */
const directPublicApiRequests: string[] = [];

/** The browser's fetch: same-origin paths reach the calculator's route handlers. */
async function browserFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const requestUrl = String(input);
  if (!requestUrl.startsWith('/')) {
    directPublicApiRequests.push(requestUrl);
    return Response.json(SAVED_RECORD_ANSWER);
  }
  const routeRequest = new Request(new URL(requestUrl, APP_URL), init);
  const handler = publicApiRoute[routeRequest.method as RouteMethod];
  return handler(routeRequest);
}

function forwardedRequests(): ForwardedRequest[] {
  return upstreamFetch.mock.calls
    .filter(([input]) => String(input) !== TOKEN_ENDPOINT)
    .map(([input, init]) => ({
      url: String(input),
      method: init?.method ?? 'GET',
      headers: new Headers(init?.headers),
    }));
}

function savedRecordOperations(credentials: V2Credentials) {
  const context = {
    client: createV2UserClient({ credentials, fetchImpl: browserFetch }),
    countryId: 'us' as const,
  };
  const savedReports = new AccountAssociationRoutes<unknown>(context, 'user-reports', 'Report');
  const savedPolicies = new AccountAssociationRoutes<unknown>(context, 'user-policies', 'Reform');
  const savedHouseholds = new AccountAssociationRoutes<unknown>(
    context,
    'user-households',
    'Household'
  );
  return [
    [
      'the saved reports',
      () => savedReports.list(),
      'GET',
      '/v2/user-reports?country_id=us&offset=0&limit=500',
    ],
    [
      'a new saved report',
      () => savedReports.create({ country_id: 'us' }),
      'POST',
      '/v2/user-reports?country_id=us',
    ],
    [
      'a saved report update',
      () => savedReports.patch(SAVED_RECORD_ID, { label: 'Renamed' }),
      'PATCH',
      `/v2/user-reports/${SAVED_RECORD_ID}?country_id=us`,
    ],
    [
      'a new saved policy',
      () => savedPolicies.create({ country_id: 'us' }),
      'POST',
      '/v2/user-policies?country_id=us',
    ],
    [
      'a saved policy',
      () => savedPolicies.get(SAVED_RECORD_ID),
      'GET',
      `/v2/user-policies/${SAVED_RECORD_ID}?country_id=us`,
    ],
    [
      'a saved policy deletion',
      () => savedPolicies.delete(SAVED_RECORD_ID),
      'DELETE',
      `/v2/user-policies/${SAVED_RECORD_ID}?country_id=us`,
    ],
    [
      'a new saved household',
      () => savedHouseholds.create({ country_id: 'us' }),
      'POST',
      '/v2/user-households?country_id=us',
    ],
    [
      'the first matching saved household',
      () => savedHouseholds.findFirst({ household_id: '12345' }),
      'GET',
      '/v2/user-households?household_id=12345&country_id=us&limit=1',
    ],
    ['the user profile', () => fetchMe(context.client, 'us'), 'GET', '/v2/me?country_id=us'],
    [
      "the user's data export",
      () => exportMe(context.client, 'us'),
      'GET',
      '/v2/me/export?country_id=us',
    ],
  ] as const;
}

const OPERATION_NAMES = savedRecordOperations({ kind: 'none' }).map(([name]) => name);

function runOperation(credentials: V2Credentials, operationName: string) {
  const operation = savedRecordOperations(credentials).find(([name]) => name === operationName);
  if (!operation) {
    throw new Error(`No saved-record operation named ${operationName}`);
  }
  const [, send, method, publicApiPathAndQuery] = operation;
  return { send, method, publicApiPathAndQuery };
}

beforeEach(() => {
  upstreamFetch.mockReset();
  directPublicApiRequests.length = 0;
  upstreamFetch.mockImplementation(async (input, init) => {
    if (String(input) === TOKEN_ENDPOINT) {
      return Response.json({ access_token: CALCULATOR_SERVER_TOKEN, expires_in: 86_400 });
    }
    if (init?.method === 'DELETE') {
      return new Response(null, { status: 204 });
    }
    return Response.json(SAVED_RECORD_ANSWER);
  });
  vi.stubGlobal('fetch', upstreamFetch);
  vi.stubEnv('VERCEL_ENV', 'preview');
  vi.stubEnv('POLICYENGINE_API_URL', STAGING_PUBLIC_API_URL);
  vi.stubEnv('POLICYENGINE_API_AUTH0_DOMAIN', 'auth.example.test');
  vi.stubEnv('POLICYENGINE_API_AUTH0_AUDIENCE', 'https://staging-api.example.test/');
  vi.stubEnv('POLICYENGINE_API_AUTH0_CLIENT_ID', 'calculator-client-id');
  vi.stubEnv('POLICYENGINE_API_AUTH0_CLIENT_SECRET', 'calculator-client-secret');
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("a signed-in user's saved records through app.policyengine.org's route", () => {
  const signedIn: V2Credentials = {
    kind: 'session',
    getAccessToken: async () => USER_ACCESS_TOKEN,
  };

  test.each(OPERATION_NAMES)(
    "given %s then the route sends the calculator's credential and the user's own token",
    async (operationName) => {
      // Given
      const { send, method, publicApiPathAndQuery } = runOperation(signedIn, operationName);

      // When
      await send();

      // Then
      expect(directPublicApiRequests).toEqual([]);
      const [forwarded, ...others] = forwardedRequests();
      expect(others).toEqual([]);
      expect(forwarded.method).toBe(method);
      expect(forwarded.url).toBe(`${STAGING_PUBLIC_API_URL}${publicApiPathAndQuery}`);
      expect(forwarded.headers.get('authorization')).toBe(`Bearer ${CALCULATOR_SERVER_TOKEN}`);
      expect(forwarded.headers.get('policyengine-user-authorization')).toBe(
        `Bearer ${USER_ACCESS_TOKEN}`
      );
      expect(forwarded.headers.get('policyengine-unauthenticated-user')).toBeNull();
    }
  );
});

describe("a signed-out browser's saved records through app.policyengine.org's route", () => {
  const signedOut: V2Credentials = { kind: 'unauthenticated', userId: BROWSER_USER_ID };

  test.each(OPERATION_NAMES)(
    "given %s then the route sends the calculator's credential and the browser's unauthenticated user",
    async (operationName) => {
      // Given
      const { send, method, publicApiPathAndQuery } = runOperation(signedOut, operationName);

      // When
      await send();

      // Then
      expect(directPublicApiRequests).toEqual([]);
      const [forwarded, ...others] = forwardedRequests();
      expect(others).toEqual([]);
      expect(forwarded.method).toBe(method);
      expect(forwarded.url).toBe(`${STAGING_PUBLIC_API_URL}${publicApiPathAndQuery}`);
      expect(forwarded.headers.get('authorization')).toBe(`Bearer ${CALCULATOR_SERVER_TOKEN}`);
      expect(forwarded.headers.get('policyengine-unauthenticated-user')).toBe(BROWSER_USER_ID);
      expect(forwarded.headers.get('policyengine-user-authorization')).toBeNull();
    }
  );
});

describe("sign-in through app.policyengine.org's route", () => {
  test("given the account upgrade then the route sends the calculator's credential, the user's token and the browser's user", async () => {
    // Given
    const client = createV2UserClient({
      credentials: { kind: 'session', getAccessToken: async () => USER_ACCESS_TOKEN },
      fetchImpl: browserFetch,
    });

    // When
    await upgradeAccount(client, 'us', BROWSER_USER_ID);

    // Then
    expect(directPublicApiRequests).toEqual([]);
    const [forwarded, ...others] = forwardedRequests();
    expect(others).toEqual([]);
    expect(forwarded.url).toBe(`${STAGING_PUBLIC_API_URL}/v2/me/upgrade?country_id=us`);
    expect(forwarded.headers.get('authorization')).toBe(`Bearer ${CALCULATOR_SERVER_TOKEN}`);
    expect(forwarded.headers.get('policyengine-user-authorization')).toBe(
      `Bearer ${USER_ACCESS_TOKEN}`
    );
    expect(forwarded.headers.get('policyengine-unauthenticated-user')).toBe(BROWSER_USER_ID);
  });
});
