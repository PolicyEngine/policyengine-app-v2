import { describe, expect, test, vi } from 'vitest';
import { fetchMe } from '@/api/v2Me';
import { createV2UserClient, isV2ApiError, V2ApiError } from '@/api/v2UserClient';
import {
  createTestApiContext,
  errorResponse,
  fetchCall,
  itemResponse,
  mockMeItem,
  noContentResponse,
  pageResponse,
  policyItem,
  TEST_ACCESS_TOKEN,
  TEST_API_BASE,
} from '@/tests/fixtures/api/v2UserMocks';

describe('v2UserClient', () => {
  test('given a request then it carries the bearer token to /v2 on the API base', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockResolvedValue(itemResponse(mockMeItem));

    // When
    const me = await fetchMe(context.client, 'us');

    // Then
    const call = fetchCall(fetchMock);
    expect(call.url.origin + call.path).toBe(`${TEST_API_BASE}/v2/me`);
    expect(call.query).toEqual({ country_id: 'us' });
    expect(call.method).toBe('GET');
    expect(call.headers.Authorization).toBe(`Bearer ${TEST_ACCESS_TOKEN}`);
    expect(me).toEqual(mockMeItem);
  });

  test('given a body then it is sent as JSON', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockResolvedValue(itemResponse(policyItem(), 201));

    // When
    await context.client.request('POST', 'user-policies', {
      query: { country_id: 'us' },
      body: { country_id: 'us', legacy_policy_id: 1 },
    });

    // Then
    const call = fetchCall(fetchMock);
    expect(call.headers['Content-Type']).toBe('application/json');
    expect(call.body).toEqual({ country_id: 'us', legacy_policy_id: 1 });
  });

  test('given an error envelope then it throws a typed error with status and message', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockResolvedValue(errorResponse(422, 'legacy_policy_id 9 does not exist'));

    // When
    const failure = context.client
      .request('GET', 'user-policies')
      .catch((caught: unknown) => caught);

    // Then
    const error = (await failure) as V2ApiError;
    expect(error).toBeInstanceOf(V2ApiError);
    expect(error.status).toBe(422);
    expect(error.message).toBe('legacy_policy_id 9 does not exist');
    expect(isV2ApiError(error, 422)).toBe(true);
  });

  test('given an error without a body then the message describes the status', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockResolvedValue(new Response('', { status: 503 }));

    // When / Then
    await expect(context.client.request('GET', 'me')).rejects.toMatchObject({
      status: 503,
      message: 'Saved work is temporarily unavailable.',
    });
  });

  test('given 204 then the result is undefined', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockResolvedValue(noContentResponse());

    // When
    const result = await context.client.request('DELETE', 'me', { query: { country_id: 'us' } });

    // Then
    expect(result).toBeUndefined();
  });

  test('given no access token then it fails with 401 without calling the API', async () => {
    // Given
    const fetchMock = vi.fn();
    const client = createV2UserClient({
      getAccessToken: async () => null,
      baseUrl: TEST_API_BASE,
      fetchImpl: fetchMock as unknown as typeof fetch,
    });

    // When / Then
    await expect(client.request('GET', 'me')).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('given a network failure then it throws status 0', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    // When / Then
    await expect(context.client.request('GET', 'me')).rejects.toMatchObject({ status: 0 });
  });

  test('given several pages then listAll reads until has_more is false', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    const first = policyItem({ id: 'a' });
    const second = policyItem({ id: 'b' });
    fetchMock
      .mockResolvedValueOnce(pageResponse([first], { hasMore: true }))
      .mockResolvedValueOnce(pageResponse([second], { offset: 1 }));

    // When
    const items = await context.client.listAll('user-policies', { country_id: 'uk' });

    // Then
    expect(items).toEqual([first, second]);
    expect(fetchCall(fetchMock, 0).query).toEqual({ country_id: 'uk', offset: '0', limit: '500' });
    expect(fetchCall(fetchMock, 1).query).toEqual({ country_id: 'uk', offset: '1', limit: '500' });
  });
});
