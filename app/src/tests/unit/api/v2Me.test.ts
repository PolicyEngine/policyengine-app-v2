import { describe, expect, test } from 'vitest';
import { dismissTypeChange } from '@/api/v2Me';
import { latestTypeChange } from '@/tests/fixtures/api/v2InvitationMocks';
import {
  createTestApiContext,
  fetchCall,
  noContentResponse,
  TEST_ACCESS_TOKEN,
} from '@/tests/fixtures/api/v2UserMocks';

describe('v2Me', () => {
  test('given a type change then dismissing it posts to its dismiss route with the session token', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    const change = latestTypeChange();
    fetchMock.mockResolvedValue(noContentResponse());

    // When
    await dismissTypeChange(context.client, change.id);

    // Then
    const request = fetchCall(fetchMock);
    expect([request.method, request.path, request.query, request.body]).toEqual([
      'POST',
      `/v2/me/type-changes/${change.id}/dismiss`,
      {},
      undefined,
    ]);
    expect(request.headers.Authorization).toBe(`Bearer ${TEST_ACCESS_TOKEN}`);
  });
});
