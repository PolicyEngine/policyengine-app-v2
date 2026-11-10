// @vitest-environment node
import { TOKEN_REQUEST_TIMEOUT_MILLISECONDS } from '@policyengine/public-api-forwarding';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { PUBLIC_API_REQUEST_LIMIT_MILLISECONDS } from '@/libs/publicApiRoute/allowList';
import * as publicApiRoute from '../../../../../calculator-app/src/app/api/policyengine/[...path]/route';

const APP_URL = 'https://app.policyengine.org';
const STAGING_PUBLIC_API_URL = 'https://public-api-staging.example.test';
const LOCAL_DEVELOPMENT_ORIGIN = 'http://localhost:5173';
const OTHER_SITE_ORIGIN = 'https://other-site.example.test';
const USER_ACCESS_TOKEN = 'signed-in-user-access-token';
const UNAUTHENTICATED_USER_ID = '3f2c8b62-4a43-4d4f-9a5c-0d1b8ad8b7e1';
const CALCULATOR_SERVER_TOKEN = 'calculator-server-token';
const TOKEN_ENDPOINT = 'https://auth.example.test/oauth/token';
const HOUSEHOLD_BODY = { household: { people: { you: { age: { 2026: 40 } } } }, policy: {} };
const OK_ANSWER = { status: 'ok', message: null, result: {} };

const HTTP_STATUS = {
  OK: 200,
  NO_CONTENT: 204,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNSUPPORTED_MEDIA_TYPE: 415,
} as const;

const fetchMock = vi.fn<typeof fetch>();

function routeRequest(
  pathAndQuery: string,
  {
    method = 'GET',
    origin,
    body,
    headers = {},
  }: { method?: string; origin?: string; body?: unknown; headers?: Record<string, string> } = {}
): Request {
  const requestHeaders = new Headers({ host: 'app.policyengine.org', ...headers });
  if (origin !== undefined) {
    requestHeaders.set('origin', origin);
  }
  if (body !== undefined && !requestHeaders.has('content-type')) {
    requestHeaders.set('content-type', 'application/json');
  }
  return new Request(`${APP_URL}/api/policyengine${pathAndQuery}`, {
    method,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function publicApiCalls() {
  return fetchMock.mock.calls.filter(([input]) => String(input) !== TOKEN_ENDPOINT);
}

function onlyPublicApiCall() {
  const calls = publicApiCalls();
  expect(calls).toHaveLength(1);
  const [input, init] = calls[0];
  return { url: String(input), method: init?.method, headers: new Headers(init?.headers) };
}

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockImplementation(async () => Response.json(OK_ANSWER));
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('VERCEL_ENV', 'preview');
  vi.stubEnv('POLICYENGINE_API_URL', STAGING_PUBLIC_API_URL);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('calculator /api/policyengine/{Public API path}', () => {
  test('given an allowed calculation then it forwards it to the same Public API path', async () => {
    // When
    const response = await publicApiRoute.POST(
      routeRequest('/us/calculate-full', { method: 'POST', body: HOUSEHOLD_BODY })
    );

    // Then
    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(onlyPublicApiCall()).toMatchObject({
      url: `${STAGING_PUBLIC_API_URL}/us/calculate-full`,
      method: 'POST',
    });
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  test('given an economy comparison then its query reaches the Public API unchanged', async () => {
    // When
    await publicApiRoute.GET(
      routeRequest('/uk/economy/12/over/1?region=uk&time_period=2026&breakdown=local_areas')
    );

    // Then
    expect(onlyPublicApiCall().url).toBe(
      `${STAGING_PUBLIC_API_URL}/uk/economy/12/over/1?region=uk&time_period=2026&breakdown=local_areas`
    );
  });

  test.each([
    ['an unlisted Public API path', 'GET', '/deployment'],
    ['the Public API root', 'GET', '/'],
    ['an unknown country', 'GET', '/fr/metadata'],
    ['a method the operation does not allow', 'DELETE', '/us/metadata'],
    ['an encoded slash', 'GET', '/us%2Fmetadata'],
    ['an encoded letter', 'GET', '/us/meta%64ata'],
    ['a trailing extra segment', 'POST', '/us/calculate-full/extra'],
    ['a calculation route the calculator does not call', 'POST', '/us/calculate'],
  ])(
    'given %s then it answers 404 without calling the Public API',
    async (_label, method, path) => {
      // When
      const handler = publicApiRoute[method as 'GET' | 'POST' | 'DELETE'];
      const response = await handler(routeRequest(path, { method }));

      // Then
      expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(fetchMock).not.toHaveBeenCalled();
    }
  );

  test('given a signed-out browser then its unauthenticated user reaches the Public API and its cookies do not', async () => {
    // When
    await publicApiRoute.GET(
      routeRequest('/v2/me', {
        headers: {
          'PolicyEngine-Unauthenticated-User': UNAUTHENTICATED_USER_ID,
          Cookie: 'appSession=secret-session',
        },
      })
    );

    // Then
    const { headers } = onlyPublicApiCall();
    expect(headers.get('policyengine-unauthenticated-user')).toBe(UNAUTHENTICATED_USER_ID);
    expect(headers.get('cookie')).toBeNull();
  });

  test("given the calculator's credential and a signed-in user then the server token and the user's token go in their own headers", async () => {
    // Given
    vi.stubEnv('POLICYENGINE_API_AUTH0_DOMAIN', 'auth.example.test');
    vi.stubEnv('POLICYENGINE_API_AUTH0_AUDIENCE', 'https://staging-api.example.test/');
    vi.stubEnv('POLICYENGINE_API_AUTH0_CLIENT_ID', 'calculator-client-id');
    vi.stubEnv('POLICYENGINE_API_AUTH0_CLIENT_SECRET', 'calculator-client-secret');
    fetchMock.mockImplementation(async (input) =>
      String(input) === TOKEN_ENDPOINT
        ? Response.json({ access_token: CALCULATOR_SERVER_TOKEN, expires_in: 86_400 })
        : Response.json(OK_ANSWER)
    );

    // When
    await publicApiRoute.GET(
      routeRequest('/v2/me', { headers: { Authorization: `Bearer ${USER_ACCESS_TOKEN}` } })
    );

    // Then
    const { headers } = onlyPublicApiCall();
    expect(headers.get('authorization')).toBe(`Bearer ${CALCULATOR_SERVER_TOKEN}`);
    expect(headers.get('policyengine-user-authorization')).toBe(`Bearer ${USER_ACCESS_TOKEN}`);
  });

  test('given an account upgrade with no body and both identities then the Public API receives both and no body', async () => {
    // When
    const response = await publicApiRoute.POST(
      routeRequest('/v2/me/upgrade?country_id=us', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${USER_ACCESS_TOKEN}`,
          'PolicyEngine-Unauthenticated-User': UNAUTHENTICATED_USER_ID,
        },
      })
    );

    // Then
    expect(response.status).toBe(HTTP_STATUS.OK);
    const calls = publicApiCalls();
    expect(calls).toHaveLength(1);
    const [, init] = calls[0];
    const headers = new Headers(init?.headers);
    expect(init?.body).toBeUndefined();
    expect(headers.get('authorization')).toBe(`Bearer ${USER_ACCESS_TOKEN}`);
    expect(headers.get('policyengine-unauthenticated-user')).toBe(UNAUTHENTICATED_USER_ID);
  });

  test('given a HEAD request, which Next answers with the GET handler, then it answers 404 without calling the Public API', async () => {
    // When
    const response = await publicApiRoute.GET(routeRequest('/us/metadata', { method: 'HEAD' }));

    // Then
    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("given another site's page loading it as an image or script, which sends no Origin, then it answers 403", async () => {
    // When
    const response = await publicApiRoute.GET(
      routeRequest('/us/metadata', { headers: { 'Sec-Fetch-Site': 'cross-site' } })
    );

    // Then
    expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('given a catalog read then the CDN may keep it for an hour', async () => {
    // When
    const response = await publicApiRoute.GET(routeRequest('/v2/model-catalog?country_id=us'));

    // Then
    expect(response.headers.get('cache-control')).toBe(
      's-maxage=3600, stale-while-revalidate=86400'
    );
  });

  test('given country metadata then only browsers keep it, for an hour', async () => {
    // When
    const response = await publicApiRoute.GET(routeRequest('/us/metadata'));

    // Then
    expect(response.headers.get('cache-control')).toBe('max-age=3600');
  });

  test("given a user's saved records then the answer is never cached", async () => {
    // When
    const response = await publicApiRoute.GET(
      routeRequest('/v2/user-policies', {
        headers: { Authorization: `Bearer ${USER_ACCESS_TOKEN}` },
      })
    );

    // Then
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  test('given a body sent as another JSON media type then it is forwarded', async () => {
    // When
    const response = await publicApiRoute.POST(
      routeRequest('/us/calculate-full', {
        method: 'POST',
        body: HOUSEHOLD_BODY,
        headers: { 'content-type': 'application/vnd.policyengine+json' },
      })
    );

    // Then
    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(publicApiCalls()).toHaveLength(1);
  });

  test('given a body that is not sent as application/json then it answers 415 without calling the Public API', async () => {
    // When
    const response = await publicApiRoute.POST(
      routeRequest('/us/calculate-full', {
        method: 'POST',
        body: HOUSEHOLD_BODY,
        headers: { 'content-type': 'text/plain' },
      })
    );

    // Then
    expect(response.status).toBe(HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('given a page on another site then it answers 403 without calling the Public API', async () => {
    // When
    const response = await publicApiRoute.GET(
      routeRequest('/us/metadata', { origin: OTHER_SITE_ORIGIN })
    );

    // Then
    expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('given a calculator page then it answers without CORS headers', async () => {
    // When
    const response = await publicApiRoute.GET(routeRequest('/us/metadata', { origin: APP_URL }));

    // Then
    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(response.headers.get('access-control-allow-origin')).toBeNull();
  });

  test('given local development then the answer allows that origin', async () => {
    // When
    const response = await publicApiRoute.GET(
      routeRequest('/us/metadata', { origin: LOCAL_DEVELOPMENT_ORIGIN })
    );

    // Then
    expect(response.headers.get('access-control-allow-origin')).toBe(LOCAL_DEVELOPMENT_ORIGIN);
  });

  test('given a preflight from local development then it allows the forwarded methods and headers', () => {
    // When
    const response = publicApiRoute.OPTIONS(
      routeRequest('/us/calculate', { method: 'OPTIONS', origin: LOCAL_DEVELOPMENT_ORIGIN })
    );

    // Then
    expect(response.status).toBe(HTTP_STATUS.NO_CONTENT);
    expect(response.headers.get('access-control-allow-headers')).toBe(
      'Content-Type, Authorization, PolicyEngine-Unauthenticated-User'
    );
  });

  test('given a preflight from another site then it answers 403', () => {
    // When
    const response = publicApiRoute.OPTIONS(
      routeRequest('/us/calculate', { method: 'OPTIONS', origin: OTHER_SITE_ORIGIN })
    );

    // Then
    expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
  });

  // A starting Public API instance can take minutes to answer any request:
  // its load balancer's records for 2026-11-03 to 2026-11-10 show country
  // metadata answered after up to 246 s, a v1 policy after 242 s, and a
  // household under a policy after 396 s, Cloud Run's 300 s counting only
  // from when an instance took the request.
  test.each([
    ['country metadata', '/us/metadata', 246],
    ['a v1 policy', '/us/policy/98765', 242],
    ['a household under a policy', '/us/household/12345/policy/2', 396],
  ])(
    'given %s (GET %s) that a starting Public API instance answers after %i seconds then the route still forwards the answer',
    async (_label, path, answerSeconds) => {
      // Given
      vi.useFakeTimers();
      fetchMock.mockImplementation(
        (_input, init) =>
          new Promise<Response>((resolve, reject) => {
            const answerTimer = setTimeout(
              () => resolve(Response.json(OK_ANSWER)),
              answerSeconds * 1000
            );
            init?.signal?.addEventListener('abort', () => {
              clearTimeout(answerTimer);
              reject(new DOMException('The request was aborted.', 'AbortError'));
            });
          })
      );

      // When
      const pendingResponse = publicApiRoute.GET(routeRequest(path));
      await vi.advanceTimersByTimeAsync(answerSeconds * 1000);
      const response = await pendingResponse;

      // Then
      expect(response.status).toBe(HTTP_STATUS.OK);
    }
  );

  test("given the route's wait for the Public API then the function may run long enough to get a token, wait and stream the answer", () => {
    // Given
    // The forwarding package's limit on a token request.
    const tokenRequestMilliseconds = TOKEN_REQUEST_TIMEOUT_MILLISECONDS;
    // Reading the request and streaming a large answer back.
    const bodyTransferMilliseconds = 30_000;

    // Then
    expect(publicApiRoute.maxDuration * 1000).toBeGreaterThanOrEqual(
      PUBLIC_API_REQUEST_LIMIT_MILLISECONDS + tokenRequestMilliseconds + bodyTransferMilliseconds
    );
  });

  test('given a preview deployment without POLICYENGINE_API_URL then it refuses rather than calling the production Public API', async () => {
    // Given
    vi.stubEnv('POLICYENGINE_API_URL', '');

    // When
    const response = await publicApiRoute.GET(routeRequest('/us/metadata'));

    // Then
    expect(response.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
