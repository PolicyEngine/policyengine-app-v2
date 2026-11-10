import { describe, expect, test } from 'vitest';
import {
  changeAdminUserType,
  fetchAdminUser,
  fetchUserTypeChanges,
  searchAdminUsers,
} from '@/api/v2AdminUsers';
import {
  ADMIN_USER_IDS,
  GRACE,
  SCRIPT_CHANGE,
  userTypeChangeItem,
} from '@/tests/fixtures/api/v2AdminUserMocks';
import {
  createTestApiContext,
  fetchCall,
  itemResponse,
  okResponse,
  TEST_ACCESS_TOKEN,
} from '@/tests/fixtures/api/v2UserMocks';

describe('v2AdminUsers', () => {
  test('given an email part and a page then the search sends them and returns the page', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    const page = { items: [GRACE], offset: 50, limit: 50, has_more: false };
    fetchMock.mockResolvedValue(okResponse(page));

    // When
    const result = await searchAdminUsers(context.client, {
      email: 'grace',
      offset: 50,
      limit: 50,
    });

    // Then
    expect(result).toEqual(page);
    const request = fetchCall(fetchMock);
    expect([request.method, request.path, request.query]).toEqual([
      'GET',
      '/v2/admin/users',
      { email: 'grace', offset: '50', limit: '50' },
    ]);
    expect(request.headers.Authorization).toBe(`Bearer ${TEST_ACCESS_TOKEN}`);
  });

  test('given no email part then the search sends no email', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockResolvedValue(okResponse({ items: [], offset: 0, limit: 50, has_more: false }));

    // When
    await searchAdminUsers(context.client, { email: '', offset: 0, limit: 50 });

    // Then
    expect(fetchCall(fetchMock).query).toEqual({ offset: '0', limit: '50' });
  });

  test('given a user ID then the user is read from its own route', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockResolvedValue(itemResponse(GRACE));

    // When
    const user = await fetchAdminUser(context.client, ADMIN_USER_IDS.GRACE);

    // Then
    expect(user).toEqual(GRACE);
    expect(fetchCall(fetchMock).path).toBe(`/v2/admin/users/${ADMIN_USER_IDS.GRACE}`);
  });

  test('given a new type then the change is sent as a PATCH of the user', async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    fetchMock.mockResolvedValue(itemResponse({ ...GRACE, user_type: 'author' }));

    // When
    const user = await changeAdminUserType(context.client, ADMIN_USER_IDS.GRACE, 'author');

    // Then
    expect(user.user_type).toBe('author');
    const request = fetchCall(fetchMock);
    expect([request.method, request.path, request.body]).toEqual([
      'PATCH',
      `/v2/admin/users/${ADMIN_USER_IDS.GRACE}`,
      { user_type: 'author' },
    ]);
  });

  test("given a user ID then the user's type changes are read, newest first as sent", async () => {
    // Given
    const { fetchMock, context } = createTestApiContext();
    const changes = [userTypeChangeItem(), SCRIPT_CHANGE];
    fetchMock.mockResolvedValue(okResponse({ items: changes }));

    // When
    const result = await fetchUserTypeChanges(context.client, ADMIN_USER_IDS.GRACE);

    // Then
    expect(result).toEqual(changes);
    expect(fetchCall(fetchMock).path).toBe(
      `/v2/admin/users/${ADMIN_USER_IDS.GRACE}/user-type-changes`
    );
  });
});
