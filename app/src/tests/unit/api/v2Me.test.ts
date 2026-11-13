import { describe, expect, test } from 'vitest';
import { dismissTypeChange, fetchMe } from '@/api/v2Me';
import { latestTypeChange, meResponse } from '@/tests/fixtures/api/v2InvitationMocks';
import {
  createTestApiContext,
  fetchCall,
  itemResponse,
  mockMeItem,
  noContentResponse,
  TEST_ACCESS_TOKEN,
} from '@/tests/fixtures/api/v2UserMocks';

describe('v2Me', () => {
  test('given /v2/me names a latest type change beside the user then it is copied onto the user', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    const change = latestTypeChange();
    fetchMock.mockResolvedValue(meResponse(mockMeItem, change));

    // When
    const me = await fetchMe(context.client, 'us');

    // Then
    expect(me).toEqual({ ...mockMeItem, latest_type_change: change });
  });

  test('given /v2/me says there is no latest type change then the user says so too', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockResolvedValue(meResponse(mockMeItem, null));

    // When
    const me = await fetchMe(context.client, 'us');

    // Then
    expect(me.latest_type_change).toBeNull();
  });

  test('given an API that sends no latest type change then the user is returned as it is', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockResolvedValue(itemResponse(mockMeItem));

    // When
    const me = await fetchMe(context.client, 'us');

    // Then
    expect(me).toStrictEqual(mockMeItem);
  });

  test('given a type change then dismissing it posts to its dismiss route with the country and the session token', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    const change = latestTypeChange();
    fetchMock.mockResolvedValue(noContentResponse());

    // When
    await dismissTypeChange(context.client, 'uk', change.id);

    // Then
    const request = fetchCall(fetchMock);
    expect([request.method, request.path, request.query, request.body]).toEqual([
      'POST',
      `/v2/me/type-changes/${change.id}/dismiss`,
      { country_id: 'uk' },
      undefined,
    ]);
    expect(request.headers.Authorization).toBe(`Bearer ${TEST_ACCESS_TOKEN}`);
  });
});
