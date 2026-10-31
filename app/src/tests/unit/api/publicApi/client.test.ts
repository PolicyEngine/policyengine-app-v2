import { describe, expect, test, vi } from 'vitest';
import {
  createPublicApiClient,
  publicApiCountryId,
  requireResult,
  type CreatePublicApiClientOptions,
} from '@/api/publicApi/client';
import { isV2ApiError, UNAUTHENTICATED_USER_HEADER } from '@/api/v2UserClient';
import {
  BROWSER_USER_ID,
  errorResponse,
  okResponse,
  TEST_ACCESS_TOKEN,
  TEST_API_BASE,
} from '@/tests/fixtures/api/v2UserMocks';

const ECONOMY_OPTIONS_RESULT = {
  policyengine_version: '6.7.5',
  current_law_id: 2,
  region: [{ name: 'us', label: 'United States', type: 'national' }],
  time_period: [{ name: 2026, label: '2026' }],
  datasets: [],
};

function clientWith(credentials: CreatePublicApiClientOptions['credentials'], response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  const client = createPublicApiClient({
    credentials,
    baseUrl: TEST_API_BASE,
    fetchImpl: fetchMock as unknown as typeof fetch,
  });
  return { client, fetchMock };
}

function sentRequest(fetchMock: ReturnType<typeof vi.fn>): Request {
  return fetchMock.mock.calls[0][0] as Request;
}

describe('createPublicApiClient', () => {
  test('given a route and query then the request goes to the API origin', async () => {
    // Given
    const { client, fetchMock } = clientWith({ kind: 'none' }, okResponse(ECONOMY_OPTIONS_RESULT));

    // When
    await client.GET('/v2/economy-options', { params: { query: { country_id: 'us' } } });

    // Then
    const request = sentRequest(fetchMock);
    expect(request.method).toBe('GET');
    expect(request.url).toBe(`${TEST_API_BASE}/v2/economy-options?country_id=us`);
    expect(request.headers.get('Authorization')).toBeNull();
    expect(request.headers.get(UNAUTHENTICATED_USER_HEADER)).toBeNull();
  });

  test('given a signed-in session then requests carry its access token', async () => {
    // Given
    const { client, fetchMock } = clientWith(
      { kind: 'session', getAccessToken: async () => TEST_ACCESS_TOKEN },
      okResponse({ items: [], offset: 0, limit: 500, has_more: false })
    );

    // When
    await client.GET('/v2/user-policies', { params: { query: { country_id: 'us' } } });

    // Then
    expect(sentRequest(fetchMock).headers.get('Authorization')).toBe(`Bearer ${TEST_ACCESS_TOKEN}`);
  });

  test("given a signed-out browser then requests name the browser's user", async () => {
    // Given
    const { client, fetchMock } = clientWith(
      { kind: 'unauthenticated', userId: BROWSER_USER_ID },
      okResponse({ items: [], offset: 0, limit: 500, has_more: false })
    );

    // When
    await client.GET('/v2/user-policies', { params: { query: { country_id: 'us' } } });

    // Then
    expect(sentRequest(fetchMock).headers.get(UNAUTHENTICATED_USER_HEADER)).toBe(BROWSER_USER_ID);
  });
});

describe('requireResult', () => {
  test('given an ok envelope then its result is returned', async () => {
    // Given
    const { client } = clientWith({ kind: 'none' }, okResponse(ECONOMY_OPTIONS_RESULT));

    // When
    const result = await requireResult(
      client.GET('/v2/economy-options', { params: { query: { country_id: 'us' } } })
    );

    // Then
    expect(result.current_law_id).toBe(2);
  });

  test("given an error response then it throws the API's status and message", async () => {
    // Given
    const { client } = clientWith(
      { kind: 'none' },
      errorResponse(404, 'policyengine_version 9.9.9 is not published for us')
    );

    // When
    const call = requireResult(
      client.GET('/v2/economy-options', {
        params: { query: { country_id: 'us', policyengine_version: '9.9.9' } },
      })
    );

    // Then
    await expect(call).rejects.toSatisfy(
      (error: unknown) =>
        isV2ApiError(error, 404) &&
        error.message === 'policyengine_version 9.9.9 is not published for us'
    );
  });

  test('given a network failure then it throws status 0', async () => {
    // Given
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    const client = createPublicApiClient({
      baseUrl: TEST_API_BASE,
      fetchImpl: fetchMock as unknown as typeof fetch,
    });

    // When
    const call = requireResult(
      client.GET('/v2/economy-options', { params: { query: { country_id: 'us' } } })
    );

    // Then
    await expect(call).rejects.toSatisfy((error: unknown) => isV2ApiError(error, 0));
  });
});

describe('publicApiCountryId', () => {
  test('given a country the v2 routes serve then it is returned as their country type', () => {
    expect(publicApiCountryId('us')).toBe('us');
    expect(publicApiCountryId('uk')).toBe('uk');
  });

  test('given a country the v2 routes do not serve then it throws before any request', () => {
    expect(() => publicApiCountryId('ca')).toThrow(
      'The Public API does not serve the country "ca"'
    );
  });
});
