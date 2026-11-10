import type { QueryClient } from '@tanstack/react-query';
import { cleanup, render, screen, userEvent, waitFor, within } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ADMIN_USER_PAGE_SIZE } from '@/hooks/useAdminUsers';
import type { AuthContextValue } from '@/libs/auth/AuthContext';
import AdminUsersPage from '@/pages/flagship/AdminUsers.page';
import {
  ADMIN_API_MESSAGES,
  ADMIN_USER_IDS,
  adminUserItem,
  ALAN,
  answerAdminApi,
  GRACE,
  holdUserReads,
  numberedAdminUsers,
  SCRIPT_CHANGE,
  sentRequests,
  SIGNED_IN_ADMIN,
  SIGNED_IN_ADMIN_USER,
  type FakeAdminApiOptions,
} from '@/tests/fixtures/api/v2AdminUserMocks';
import { deferredResponse, errorResponse, meItemOfType } from '@/tests/fixtures/api/v2UserMocks';
import {
  createProductionLikeQueryClient,
  createTestQueryClient,
  forgetWindowFocus,
  letPendingWorkRun,
  returnToWindow,
  UserSessionProviders,
} from '@/tests/fixtures/hooks/useMeMocks';
import { makeAuthValue, signedInAuthValue } from '@/tests/fixtures/libs/auth/authMocks';

const fetchMock = vi.fn();

/** A user who signs in for the first time while the page is open. */
const NEW_USER = adminUserItem({
  id: '4d9c6f80-0e3f-4a5c-9b7d-3c4d5e6f7081',
  email: 'bob@example.org',
  first_name: 'Bob',
  last_name: 'Kahn',
});

function renderAdminPage({
  auth = signedInAuthValue(),
  queryClient = createTestQueryClient(),
}: { auth?: AuthContextValue; queryClient?: QueryClient } = {}) {
  return render(
    <UserSessionProviders queryClient={queryClient} session={{ auth, countryId: 'us' }}>
      <AdminUsersPage />
    </UserSessionProviders>
  );
}

/** Renders the page as an admin and opens `email`'s details from the list of users. */
async function openUserDetails(
  email: string,
  options: FakeAdminApiOptions = {},
  queryClient: QueryClient = createTestQueryClient()
) {
  const user = userEvent.setup();
  const apiState = answerAdminApi(fetchMock, options);
  renderAdminPage({ queryClient });
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

/** Asks to change to `typeLabel` and waits until the confirmation has read the user's current type. */
async function askToChangeTypeAndWaitForTheCheck(
  user: ReturnType<typeof userEvent.setup>,
  typeLabel: string
) {
  const confirmation = await askToChangeType(user, typeLabel);
  await waitFor(() => expect(within(confirmation).queryByText(/Checking/)).not.toBeInTheDocument());
  return confirmation;
}

function adminRequests(): string[] {
  return sentRequests(fetchMock).filter((request) => request.includes('/v2/admin/'));
}

function patchRequests(): string[] {
  return adminRequests().filter((request) => request.startsWith('PATCH'));
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  // Unmount first: handing focus back with queries still mounted would read them again.
  cleanup();
  forgetWindowFocus();
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

  test('given a signed-out visitor then the page is not found and nothing is requested', async () => {
    // When
    renderAdminPage({ auth: makeAuthValue() });
    await letPendingWorkRun();

    // Then
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('given /v2/me has not answered then the page shows that it is loading', async () => {
    // Given
    fetchMock.mockImplementation(() => deferredResponse().response);

    // When
    renderAdminPage();

    // Then
    expect(await screen.findByRole('status')).toHaveTextContent('Loading…');
  });

  test('given /v2/me fails then the page shows the error, and trying again shows the page', async () => {
    // Given
    const user = userEvent.setup();
    fetchMock.mockImplementation(async () =>
      errorResponse(503, 'Saved work is temporarily unavailable.')
    );
    renderAdminPage();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Saved work is temporarily unavailable.'
    );
    answerAdminApi(fetchMock);

    // When
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    // Then
    expect(await screen.findByRole('heading', { name: 'Users' })).toBeInTheDocument();
  });

  test('given an admin then the newest users are listed first, with their email, name, type and last seen', async () => {
    // Given
    answerAdminApi(fetchMock);

    // When
    renderAdminPage();

    // Then
    const graceRow = (await screen.findByRole('button', { name: GRACE.email! })).closest('tr')!;
    const rows = within(screen.getByRole('table', { name: 'Users' })).getAllByRole('row');
    expect(rows.slice(1).map((row) => within(row).getAllByRole('cell')[0].textContent)).toEqual([
      GRACE.email,
      ALAN.email,
    ]);
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

  test('given the same search is submitted again then the users are read again', async () => {
    // Given
    const user = userEvent.setup();
    const apiState = answerAdminApi(fetchMock);
    renderAdminPage({ queryClient: createProductionLikeQueryClient() });
    await screen.findByRole('button', { name: GRACE.email! });
    await user.type(screen.getByRole('searchbox', { name: 'Email' }), 'bob');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await screen.findByText('No signed-in user has an email that contains this.');
    apiState.users.unshift(NEW_USER);

    // When
    await user.click(screen.getByRole('button', { name: 'Search' }));

    // Then
    expect(await screen.findByRole('button', { name: NEW_USER.email! })).toBeInTheDocument();
  });

  test('given the production cache defaults then returning to the window reads the users again', async () => {
    // Given
    const apiState = answerAdminApi(fetchMock);
    renderAdminPage({ queryClient: createProductionLikeQueryClient() });
    await screen.findByRole('button', { name: GRACE.email! });
    apiState.users.unshift(NEW_USER);

    // When
    await returnToWindow();

    // Then
    expect(await screen.findByRole('button', { name: NEW_USER.email! })).toBeInTheDocument();
  });

  test('given a refetch of the users fails then the list stays', async () => {
    // Given
    answerAdminApi(fetchMock);
    renderAdminPage();
    await screen.findByRole('button', { name: GRACE.email! });
    fetchMock.mockImplementation(async () =>
      errorResponse(503, 'Saved work is temporarily unavailable.')
    );

    // When
    await returnToWindow();
    await letPendingWorkRun();

    // Then
    expect(screen.getByRole('button', { name: GRACE.email! })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
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

  test('given a user signs up between pages then load more lists each user once', async () => {
    // Given
    const user = userEvent.setup();
    const users = numberedAdminUsers(ADMIN_USER_PAGE_SIZE + 1);
    const apiState = answerAdminApi(fetchMock, { users });
    renderAdminPage();
    await screen.findByRole('button', { name: users[0].email! });
    apiState.users.unshift(NEW_USER);

    // When
    await user.click(screen.getByRole('button', { name: 'Load more' }));
    await screen.findByRole('button', { name: users.at(-1)!.email! });

    // Then
    const lastOfFirstPage = users[ADMIN_USER_PAGE_SIZE - 1].email!;
    expect(screen.getAllByRole('button', { name: lastOfFirstPage })).toHaveLength(1);
  });

  test('given the production cache defaults then selecting a user again reads it again', async () => {
    // Given
    const { user, apiState } = await openUserDetails(
      GRACE.email!,
      {},
      createProductionLikeQueryClient()
    );
    await user.click(screen.getByRole('button', { name: ALAN.email! }));
    await screen.findByText(ALAN.id);
    apiState.users.find((candidate) => candidate.id === GRACE.id)!.user_type = 'admin';

    // When
    await user.click(screen.getByRole('button', { name: GRACE.email! }));
    await screen.findByText(GRACE.id);

    // Then
    expect(await screen.findByRole('radio', { name: 'Admin', checked: true })).toBeInTheDocument();
  });

  test('given a refetch of the user fails then the details stay', async () => {
    // Given
    await openUserDetails(GRACE.email!);
    fetchMock.mockImplementation(async () =>
      errorResponse(503, 'Saved work is temporarily unavailable.')
    );

    // When
    await returnToWindow();
    await letPendingWorkRun();

    // Then
    expect(screen.getByText(GRACE.id)).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'User type' })).toBeInTheDocument();
  });

  test('given the user cannot be read then trying again shows the details', async () => {
    // Given
    const user = userEvent.setup();
    answerAdminApi(fetchMock);
    const answerAsTheApi = fetchMock.getMockImplementation()!;
    fetchMock.mockImplementation(async (url: string, init: RequestInit) =>
      new URL(url).pathname === `/v2/admin/users/${GRACE.id}`
        ? errorResponse(503, 'Saved work is temporarily unavailable.')
        : answerAsTheApi(url, init)
    );
    renderAdminPage();
    await user.click(await screen.findByRole('button', { name: GRACE.email! }));
    expect(await screen.findByText(/We could not load this user/)).toBeInTheDocument();
    fetchMock.mockImplementation(answerAsTheApi);

    // When
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    // Then
    expect(await screen.findByText(GRACE.id)).toBeInTheDocument();
  });

  test('given the type changes cannot be read then trying again shows them', async () => {
    // Given
    const user = userEvent.setup();
    answerAdminApi(fetchMock, { changes: [SCRIPT_CHANGE] });
    const answerAsTheApi = fetchMock.getMockImplementation()!;
    fetchMock.mockImplementation(async (url: string, init: RequestInit) =>
      new URL(url).pathname.endsWith('/user-type-changes')
        ? errorResponse(503, 'Saved work is temporarily unavailable.')
        : answerAsTheApi(url, init)
    );
    renderAdminPage();
    await user.click(await screen.findByRole('button', { name: GRACE.email! }));
    expect(await screen.findByText(/We could not load the type changes/)).toBeInTheDocument();
    fetchMock.mockImplementation(answerAsTheApi);

    // When
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    // Then
    expect(await screen.findByRole('list', { name: 'Type changes' })).toBeInTheDocument();
  });

  test("given a new type then the confirmation names the user's email and the old and new types", async () => {
    // Given
    const { user } = await openUserDetails(GRACE.email!);

    // When
    const confirmation = await askToChangeTypeAndWaitForTheCheck(user, 'Author');

    // Then
    expect(confirmation).toHaveTextContent(`${GRACE.email} will change from Standard to Author.`);
  });

  test('given another admin changed the user since it was loaded then the confirmation names the current type', async () => {
    // Given
    const { user, apiState } = await openUserDetails(
      GRACE.email!,
      {},
      createProductionLikeQueryClient()
    );
    apiState.users.find((candidate) => candidate.id === GRACE.id)!.user_type = 'admin';

    // When
    const confirmation = await askToChangeTypeAndWaitForTheCheck(user, 'Author');

    // Then
    expect(confirmation).toHaveTextContent(`${GRACE.email} will change from Admin to Author.`);
  });

  test("given the confirmation has not read the user's current type then it cannot be confirmed", async () => {
    // Given
    const { user } = await openUserDetails(GRACE.email!);
    const { answerHeldUserReads } = holdUserReads(fetchMock);
    const confirmation = await askToChangeType(user, 'Author');
    const confirmButton = within(confirmation).getByRole('button', { name: 'Confirm change' });
    expect(confirmButton).toBeDisabled();

    // When
    answerHeldUserReads();

    // Then
    await waitFor(() => expect(confirmButton).toBeEnabled());
  });

  test('given the user already has the chosen type when the confirmation reads it then it says so and sends nothing', async () => {
    // Given
    const { user, apiState } = await openUserDetails(
      GRACE.email!,
      {},
      createProductionLikeQueryClient()
    );
    apiState.users.find((candidate) => candidate.id === GRACE.id)!.user_type = 'author';

    // When
    const confirmation = await askToChangeTypeAndWaitForTheCheck(user, 'Author');

    // Then
    expect(confirmation).toHaveTextContent(
      `${GRACE.email} is already Author. Nothing will change.`
    );
    expect(
      within(confirmation).queryByRole('button', { name: 'Confirm change' })
    ).not.toBeInTheDocument();
    expect(patchRequests()).toEqual([]);
  });

  test('given an admin is about to demote themselves then the confirmation warns them', async () => {
    // Given
    const { user } = await openUserDetails(SIGNED_IN_ADMIN.email!, {
      users: [SIGNED_IN_ADMIN_USER, GRACE],
    });

    // When
    const confirmation = await askToChangeTypeAndWaitForTheCheck(user, 'Standard');

    // Then
    expect(confirmation).toHaveTextContent(
      'This is your own account: you will no longer be an admin, and you will lose this page.'
    );
  });

  test('given the confirmation is cancelled then no change is sent', async () => {
    // Given
    const { user } = await openUserDetails(GRACE.email!);
    const confirmation = await askToChangeTypeAndWaitForTheCheck(user, 'Author');

    // When
    await user.click(within(confirmation).getByRole('button', { name: 'Cancel' }));

    // Then
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(patchRequests()).toEqual([]);
  });

  test('given the change is confirmed then the PATCH is sent and the history shows the change', async () => {
    // Given
    const { user } = await openUserDetails(GRACE.email!);
    const confirmation = await askToChangeTypeAndWaitForTheCheck(user, 'Author');

    // When
    await user.click(within(confirmation).getByRole('button', { name: 'Confirm change' }));

    // Then
    const history = await screen.findByRole('list', { name: 'Type changes' });
    expect(await within(history).findByText('Standard to Author')).toBeInTheDocument();
    expect(within(history).getByText(`Changed by ${SIGNED_IN_ADMIN.email}`)).toBeInTheDocument();
    const patchCall = fetchMock.mock.calls.find(([, init]) => init.method === 'PATCH')!;
    expect([patchCall[0], JSON.parse(patchCall[1].body)]).toEqual([
      `https://api.policyengine.org/v2/admin/users/${ADMIN_USER_IDS.GRACE}`,
      { user_type: 'author' },
    ]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test.each([
    [409, ADMIN_API_MESSAGES.LAST_ADMIN_DEMOTION],
    [404, ADMIN_API_MESSAGES.NO_SIGNED_IN_USER],
  ])('given the API refuses the change with %i then its message shows', async (status, message) => {
    // Given
    const { user } = await openUserDetails(GRACE.email!, {
      users: [{ ...GRACE, user_type: 'admin' }],
      patchRefusal: { status, message },
    });
    const confirmation = await askToChangeTypeAndWaitForTheCheck(user, 'Standard');

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
    expect(await within(history).findByText('Standard to Admin')).toBeInTheDocument();
    expect(within(history).getByText('Set by the type script')).toBeInTheDocument();
    expect(within(history).queryByText(/Changed by/)).not.toBeInTheDocument();
  });
});
