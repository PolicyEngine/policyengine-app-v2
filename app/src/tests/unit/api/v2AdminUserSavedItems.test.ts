import { describe, expect, test } from 'vitest';
import { fetchAdminUserSavedItems } from '@/api/v2AdminUserSavedItems';
import { GRACE_SAVED_ITEMS } from '@/tests/fixtures/api/v2AdminUserSavedItemsMocks';
import { ADMIN_USER_IDS } from '@/tests/fixtures/api/v2AdminUserMocks';
import {
  createTestApiContext,
  fetchCall,
  okResponse,
  TEST_ACCESS_TOKEN,
} from '@/tests/fixtures/api/v2UserMocks';

describe('v2AdminUserSavedItems', () => {
  test("given a user ID then the user's saved items are read from its own route with no query", async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockResolvedValue(okResponse(GRACE_SAVED_ITEMS));

    // When
    const savedItems = await fetchAdminUserSavedItems(context.client, ADMIN_USER_IDS.GRACE);

    // Then
    expect(savedItems).toEqual(GRACE_SAVED_ITEMS);
    const request = fetchCall(fetchMock);
    expect([request.method, request.path, request.query]).toEqual([
      'GET',
      `/v2/admin/users/${ADMIN_USER_IDS.GRACE}/saved-items`,
      {},
    ]);
    expect(request.headers.Authorization).toBe(`Bearer ${TEST_ACCESS_TOKEN}`);
  });

  test('given a user ID with characters a path cannot hold then it is encoded', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockResolvedValue(okResponse(GRACE_SAVED_ITEMS));

    // When
    await fetchAdminUserSavedItems(context.client, '../me');

    // Then
    expect(fetchCall(fetchMock).path).toBe('/v2/admin/users/..%2Fme/saved-items');
  });
});
