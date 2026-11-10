import { render, screen, userEvent, waitFor, within } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ADMIN_USER_PAGE_SIZE } from '@/hooks/useAdminUsers';
import type { AuthContextValue } from '@/libs/auth/AuthContext';
import AdminUsersPage from '@/pages/flagship/AdminUsers.page';
import {
  ADMIN_USER_IDS,
  ALAN,
  answerAdminApi,
  GRACE,
  numberedAdminUsers,
  SCRIPT_CHANGE,
  sentRequests,
  SIGNED_IN_ADMIN,
  type FakeAdminApiOptions,
} from '@/tests/fixtures/api/v2AdminUserMocks';
import { meItemOfType } from '@/tests/fixtures/api/v2UserMocks';
import { createTestQueryClient, UserSessionProviders } from '@/tests/fixtures/hooks/useMeMocks';
import { makeAuthValue, signedInAuthValue } from '@/tests/fixtures/libs/auth/authMocks';

const fetchMock = vi.fn();

function renderAdminPage(auth: AuthContextValue = signedInAuthValue()) {
  return render(
    <UserSessionProviders queryClient={createTestQueryClient()} session={{ auth, countryId: 'us' }}>
      <AdminUsersPage />
    </UserSessionProviders>
  );
}

/** Renders the page as an admin and opens `email`'s details from the list of users. */
async function openUserDetails(email: string, options: FakeAdminApiOptions = {}) {
  const user = userEvent.setup();
  const apiState = answerAdminApi(fetchMock, options);
  renderAdminPage();
  await user.click(await screen.findByRole('button', { name: email }));
  await screen.findByRole('radiogroup', { name: 'User type' });
  return { user, apiState };
}

/** Chooses `typeLabel` for the open user and asks to change to it. */
async function askToChangeType(user: ReturnType<typeof userEvent.setup>, typeLabel: string) {
  await user.click(screen.getByRole('radio', { name: typeLabel }));
  await user.click(screen.getByRole('button', { name: 'Change type' }));
  return screen.findByRole('dialog');
}

function adminRequests(): string[] {
  return sentRequests(fetchMock).filter((request) => request.includes('/v2/admin/'));
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AdminUsersPage', () => {
  test('given a standard user then the page is not found and no users are requested', async () => {
    // Given
    answerAdminApi(fetchMock, { signedInUser: meItemOfType('standard') });

    // When
    renderAdminPage();

    // Then
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Users' })).not.toBeInTheDocument();
    expect(adminRequests()).toEqual([]);
  });

  test('given a signed-out visitor then the page is not found and nothing is requested', () => {
    // When
    renderAdminPage(makeAuthValue());

    // Then
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('given an admin then the newest users are listed with their email, name, type and last seen', async () => {
    // Given
    answerAdminApi(fetchMock);

    // When
    renderAdminPage();

    // Then
    const graceRow = (await screen.findByRole('button', { name: GRACE.email! })).closest('tr')!;
    expect(within(graceRow).getByText('Grace Hopper')).toBeInTheDocument();
    expect(within(graceRow).getByText('Standard')).toBeInTheDocument();
    const alanRow = screen.getByRole('button', { name: ALAN.email! }).closest('tr')!;
    expect(within(alanRow).getByText('Never')).toBeInTheDocument();
    expect(adminRequests()).toEqual([`GET /v2/admin/users?offset=0&limit=${ADMIN_USER_PAGE_SIZE}`]);
  });

  test('given an email search then the email is sent and only matching users show', async () => {
    // Given
    const user = userEvent.setup();
    answerAdminApi(fetchMock);
    renderAdminPage();
    await screen.findByRole('button', { name: GRACE.email! });

    // When
    await user.type(screen.getByRole('searchbox', { name: 'Email' }), 'ALAN');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    // Then
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: GRACE.email! })).not.toBeInTheDocument()
    );
    expect(screen.getByRole('button', { name: ALAN.email! })).toBeInTheDocument();
    expect(adminRequests()).toContain(
      `GET /v2/admin/users?email=ALAN&offset=0&limit=${ADMIN_USER_PAGE_SIZE}`
    );
  });

  test('given more users than one page then load more shows the next page', async () => {
    // Given
    const user = userEvent.setup();
    const users = numberedAdminUsers(ADMIN_USER_PAGE_SIZE + 3);
    answerAdminApi(fetchMock, { users });
    renderAdminPage();
    await screen.findByRole('button', { name: users[0].email! });
    expect(screen.queryByRole('button', { name: users.at(-1)!.email! })).not.toBeInTheDocument();

    // When
    await user.click(screen.getByRole('button', { name: 'Load more' }));

    // Then
    expect(await screen.findByRole('button', { name: users.at(-1)!.email! })).toBeInTheDocument();
    expect(adminRequests()).toContain(
      `GET /v2/admin/users?offset=${ADMIN_USER_PAGE_SIZE}&limit=${ADMIN_USER_PAGE_SIZE}`
    );
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
  });

  test("given a new type then the confirmation names the user's email and the old and new types", async () => {
    // Given
    const { user } = await openUserDetails(GRACE.email!);

    // When
    const confirmation = await askToChangeType(user, 'Author');

    // Then
    expect(confirmation).toHaveTextContent(`${GRACE.email} will change from standard to author.`);
  });

  test('given the confirmation is cancelled then no change is sent', async () => {
    // Given
    const { user } = await openUserDetails(GRACE.email!);
    const confirmation = await askToChangeType(user, 'Author');

    // When
    await user.click(within(confirmation).getByRole('button', { name: 'Cancel' }));

    // Then
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(adminRequests().filter((request) => request.startsWith('PATCH'))).toEqual([]);
  });

  test('given the change is confirmed then the PATCH is sent and the history shows the change', async () => {
    // Given
    const { user } = await openUserDetails(GRACE.email!);
    const confirmation = await askToChangeType(user, 'Author');

    // When
    await user.click(within(confirmation).getByRole('button', { name: 'Confirm change' }));

    // Then
    const history = await screen.findByRole('list', { name: 'Type changes' });
    expect(await within(history).findByText('Standard to author')).toBeInTheDocument();
    expect(within(history).getByText(`Changed by ${SIGNED_IN_ADMIN.email}`)).toBeInTheDocument();
    const patchCall = fetchMock.mock.calls.find(([, init]) => init.method === 'PATCH')!;
    expect([patchCall[0], JSON.parse(patchCall[1].body)]).toEqual([
      `https://api.policyengine.org/v2/admin/users/${ADMIN_USER_IDS.GRACE}`,
      { user_type: 'author' },
    ]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test.each([
    [409, 'This change would leave no admin.'],
    [404, 'No signed-in user has this ID.'],
  ])('given the API refuses the change with %i then its message shows', async (status, message) => {
    // Given
    const { user } = await openUserDetails(GRACE.email!, {
      users: [{ ...GRACE, user_type: 'admin' }],
      patchRefusal: { status, message },
    });
    const confirmation = await askToChangeType(user, 'Standard');

    // When
    await user.click(within(confirmation).getByRole('button', { name: 'Confirm change' }));

    // Then
    expect(await within(confirmation).findByRole('alert')).toHaveTextContent(message);
  });

  test('given a change the type script made then the history names the script and no admin', async () => {
    // When
    await openUserDetails(GRACE.email!, { changes: [SCRIPT_CHANGE] });

    // Then
    const history = await screen.findByRole('list', { name: 'Type changes' });
    expect(await within(history).findByText('Standard to admin')).toBeInTheDocument();
    expect(within(history).getByText('Set by the type script')).toBeInTheDocument();
    expect(within(history).queryByText(/Changed by/)).not.toBeInTheDocument();
  });
});
