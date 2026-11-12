import { render, screen } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import UserTypeChangeHistory from '@/components/admin/UserTypeChangeHistory';
import {
  ADMIN_USER_IDS,
  answerAdminApi,
  SIGNED_IN_ADMIN,
  userTypeChangeItem,
} from '@/tests/fixtures/api/v2AdminUserMocks';
import { createTestQueryClient, UserSessionProviders } from '@/tests/fixtures/hooks/useMeMocks';
import { signedInAuthValue } from '@/tests/fixtures/libs/auth/authMocks';

const fetchMock = vi.fn();

function renderHistory() {
  render(
    <UserSessionProviders
      queryClient={createTestQueryClient()}
      session={{ auth: signedInAuthValue(), countryId: 'us' }}
    >
      <UserTypeChangeHistory userId={ADMIN_USER_IDS.GRACE} />
    </UserSessionProviders>
  );
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('UserTypeChangeHistory', () => {
  test("given a change from an accepted invitation then it names the inviting admin's invitation", async () => {
    // Given
    answerAdminApi(fetchMock, { changes: [userTypeChangeItem({ source: 'invitation' })] });

    // When
    renderHistory();

    // Then
    expect(
      await screen.findByText(`Accepted an invitation from ${SIGNED_IN_ADMIN.email}`)
    ).toBeInTheDocument();
  });

  test('given an invitation whose admin has no email then it says an admin invited the user', async () => {
    // Given
    answerAdminApi(fetchMock, {
      changes: [
        userTypeChangeItem({
          source: 'invitation',
          changed_by_user_id: null,
          changed_by_email: null,
        }),
      ],
    });

    // When
    renderHistory();

    // Then
    expect(await screen.findByText("Accepted an admin's invitation")).toBeInTheDocument();
  });
});
