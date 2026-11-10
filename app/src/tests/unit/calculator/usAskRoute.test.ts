// @vitest-environment node
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// The model is never reached in these tests: they check how the route
// reads US metadata before it starts.
vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = {
      stream: () => {
        throw new Error('The model is not called in these tests.');
      },
    };
  },
}));

const PRODUCTION_PUBLIC_API_URL = 'https://api.policyengine.org';
const STAGING_PUBLIC_API_URL = 'https://public-api-staging.example.test';
const OTHER_METADATA_URL = 'https://metadata-copy.example.test/us/metadata';
const TOKEN_ENDPOINT = 'https://auth.example.test/oauth/token';
const CALCULATOR_SERVER_TOKEN = 'calculator-server-token';
const US_METADATA_ANSWER = { status: 'ok', message: null, result: { parameters: {} } };

const fetchMock = vi.fn<typeof fetch>();

function askRequest(): Request {
  return new Request('https://app.policyengine.org/api/us-ask/chat/message', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: 'Raise the CTC' }] }),
  });
}

async function askRoute() {
  // A fresh module each time: the route keeps the metadata it read.
  vi.resetModules();
  return import('../../../../../calculator-app/src/app/api/us-ask/chat/message/route');
}

function metadataRequests() {
  return fetchMock.mock.calls
    .filter(([input]) => String(input) !== TOKEN_ENDPOINT)
    .map(([input, init]) => ({ url: String(input), headers: new Headers(init?.headers) }));
}

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (input) =>
    String(input) === TOKEN_ENDPOINT
      ? Response.json({ access_token: CALCULATOR_SERVER_TOKEN, expires_in: 86_400 })
      : Response.json(US_METADATA_ANSWER)
  );
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('NEXT_PUBLIC_US_ASK', 'on');
  vi.stubEnv('ANTHROPIC_API_KEY', 'test-anthropic-key');
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

describe('calculator /api/us-ask/chat/message', () => {
  test("given the calculator's credential then it reads US metadata from the deployment's Public API with it", async () => {
    // Given
    const { POST } = await askRoute();

    // When
    await POST(askRequest());

    // Then
    const requests = metadataRequests();
    expect(requests.map((request) => request.url)).toEqual([
      `${STAGING_PUBLIC_API_URL}/us/metadata`,
    ]);
    expect(requests[0].headers.get('authorization')).toBe(`Bearer ${CALCULATOR_SERVER_TOKEN}`);
  });

  test('given a preview without POLICYENGINE_API_URL then it answers 502 without calling the production Public API', async () => {
    // Given
    vi.stubEnv('POLICYENGINE_API_URL', '');
    const { POST } = await askRoute();

    // When
    const response = await POST(askRequest());

    // Then
    expect(response.status).toBe(502);
    expect(
      metadataRequests().filter((request) => request.url.startsWith(PRODUCTION_PUBLIC_API_URL))
    ).toEqual([]);
  });

  test('given the Public API fails once then the route answers 502 and reads the metadata again next time', async () => {
    // Given
    const { POST } = await askRoute();
    // Keyed by address, since a token may already be cached from an earlier test.
    let metadataReadsToFail = 1;
    fetchMock.mockImplementation(async (input) => {
      if (String(input) === TOKEN_ENDPOINT) {
        return Response.json({ access_token: CALCULATOR_SERVER_TOKEN, expires_in: 86_400 });
      }
      if (metadataReadsToFail > 0) {
        metadataReadsToFail -= 1;
        return Response.json({ status: 'error', message: 'Unavailable' }, { status: 503 });
      }
      return Response.json(US_METADATA_ANSWER);
    });

    // When
    const firstResponse = await POST(askRequest());
    await POST(askRequest());

    // Then
    expect(firstResponse.status).toBe(502);
    expect(metadataRequests().map((request) => request.url)).toEqual([
      `${STAGING_PUBLIC_API_URL}/us/metadata`,
      `${STAGING_PUBLIC_API_URL}/us/metadata`,
    ]);
  });

  test("given a browser's identity on the request then the metadata read carries none of it", async () => {
    // Given
    const { POST } = await askRoute();
    const request = askRequest();
    request.headers.set('Authorization', 'Bearer signed-in-user-access-token');
    request.headers.set('Cookie', 'appSession=secret-session');

    // When
    await POST(request);

    // Then
    const [metadataRequest] = metadataRequests();
    expect(metadataRequest.headers.get('authorization')).toBe(`Bearer ${CALCULATOR_SERVER_TOKEN}`);
    expect(metadataRequest.headers.get('policyengine-user-authorization')).toBeNull();
    expect(metadataRequest.headers.get('cookie')).toBeNull();
  });

  test('given US_METADATA_URL names another address then the metadata still comes from the Public API with the credential', async () => {
    // Given
    vi.stubEnv('US_METADATA_URL', OTHER_METADATA_URL);
    const { POST } = await askRoute();

    // When
    await POST(askRequest());

    // Then
    expect(metadataRequests().map((request) => request.url)).toEqual([
      `${STAGING_PUBLIC_API_URL}/us/metadata`,
    ]);
  });
});
