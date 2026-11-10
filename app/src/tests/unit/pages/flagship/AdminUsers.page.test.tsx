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
  answerAsDemotedAdmin,
  GRACE,
  holdAnswersOfUserReads,
  holdRequests,
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
  reconnect,
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

function listReads(): string[] {
  return adminRequests().filter((request) => request.startsWith('GET /v2/admin/users?'));
}

function meReads(): string[] {
  return sentRequests(fetchMock).filter((request) => request.startsWith('GET /v2/me'));
}

function readsOfUser(userId: string): string[] {
  return adminRequests().filter((request) => request === `GET /v2/admin/users/${userId}`);
}

function deleteUser(apiState: ReturnType<typeof answerAdminApi>, userId: string) {
  apiState.users.splice(
    apiState.users.findIndex((candidate) => candidate.id === userId),
    1
  );
}

/** Lets queued work run several times over, long enough for immediate retries to finish. */
async function letRetriesRun() {
  for (let round = 0; round < 10; round += 1) {
    await letPendingWorkRun();
  }
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
    expect(await screen.findByText('Loading…')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
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

  test('given the API refuses the change with 409 then its message shows', async () => {
    // Given
    const { user } = await openUserDetails(GRACE.email!, {
      users: [{ ...GRACE, user_type: 'admin' }],
      patchRefusal: { status: 409, message: ADMIN_API_MESSAGES.LAST_ADMIN_DEMOTION },
    });
    const confirmation = await askToChangeTypeAndWaitForTheCheck(user, 'Standard');

    // When
    await user.click(within(confirmation).getByRole('button', { name: 'Confirm change' }));

    // Then
    expect(await within(confirmation).findByRole('alert')).toHaveTextContent(
      ADMIN_API_MESSAGES.LAST_ADMIN_DEMOTION
    );
  });

  test('given the user is deleted before the change is confirmed then the user is read again and shown as gone', async () => {
    // Given
    const { user, apiState } = await openUserDetails(GRACE.email!);
    const confirmation = await askToChangeTypeAndWaitForTheCheck(user, 'Author');
    deleteUser(apiState, GRACE.id);
    const userReadsBefore = readsOfUser(GRACE.id).length;

    // When
    await user.click(within(confirmation).getByRole('button', { name: 'Confirm change' }));

    // Then
    expect(await screen.findByText('This user no longer exists.')).toBeInTheDocument();
    expect(readsOfUser(GRACE.id).length).toBeGreaterThan(userReadsBefore);
  });

  test('given the user is deleted before the change is confirmed then focus moves to the details heading', async () => {
    // Given
    const { user, apiState } = await openUserDetails(GRACE.email!);
    const confirmation = await askToChangeTypeAndWaitForTheCheck(user, 'Author');
    deleteUser(apiState, GRACE.id);

    // When
    await user.click(within(confirmation).getByRole('button', { name: 'Confirm change' }));
    await screen.findByText('This user no longer exists.');

    // Then
    await waitFor(() => expect(screen.getByRole('heading', { name: GRACE.email! })).toHaveFocus());
  });

  test('given the confirmation is cancelled then focus returns to "Change type"', async () => {
    // Given
    const { user } = await openUserDetails(GRACE.email!);
    const confirmation = await askToChangeTypeAndWaitForTheCheck(user, 'Author');

    // When
    await user.click(within(confirmation).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    // Then
    await waitFor(() => expect(screen.getByRole('button', { name: 'Change type' })).toHaveFocus());
  });

  test('given the confirmation is closed with Escape then focus returns to "Change type"', async () => {
    // Given
    const { user } = await openUserDetails(GRACE.email!);
    await askToChangeTypeAndWaitForTheCheck(user, 'Author');

    // When
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    // Then
    await waitFor(() => expect(screen.getByRole('button', { name: 'Change type' })).toHaveFocus());
  });

  test('given a read of the user that answers after the change then the change is kept', async () => {
    // Given
    const { user } = await openUserDetails(GRACE.email!);
    const confirmation = await askToChangeTypeAndWaitForTheCheck(user, 'Author');
    const { deliverHeldAnswers } = holdAnswersOfUserReads(fetchMock, GRACE.id);
    await returnToWindow();
    await letPendingWorkRun();

    // When
    await user.click(within(confirmation).getByRole('button', { name: 'Confirm change' }));
    await screen.findByText('Standard to Author');
    deliverHeldAnswers();
    await letRetriesRun();

    // Then
    expect(screen.getByRole('radio', { name: 'Author' })).toBeChecked();
  });

  test('given a refused list then returning to the window keeps the refusal showing while it is read again', async () => {
    // Given
    answerAdminApi(fetchMock);
    renderAdminPage();
    await screen.findByRole('button', { name: GRACE.email! });
    // The admin routes refuse, and /v2/me cannot be read, so it still says admin.
    fetchMock.mockImplementation(async (url: string) =>
      new URL(url).pathname === '/v2/me'
        ? errorResponse(503, 'Saved work is temporarily unavailable.')
        : errorResponse(403, ADMIN_API_MESSAGES.ADMINS_ONLY)
    );
    await returnToWindow();
    await screen.findByText(/We could not load the users/);
    const { answerHeldRequests } = holdRequests(
      fetchMock,
      (method, path) => method === 'GET' && path === '/v2/admin/users'
    );

    // When
    await returnToWindow();
    await letPendingWorkRun();

    // Then
    expect(screen.queryByRole('button', { name: GRACE.email! })).not.toBeInTheDocument();
    answerHeldRequests();
  });

  test('given several admin reads are refused at once then /v2/me is read once', async () => {
    // Given
    await openUserDetails(GRACE.email!, {}, createProductionLikeQueryClient());
    const meReadsBefore = meReads().length;
    answerAsDemotedAdmin(fetchMock);

    // When
    await returnToWindow();
    await screen.findByRole('heading', { name: 'Page not found' });
    await letRetriesRun();

    // Then
    expect(meReads().length - meReadsBefore).toBe(1);
  });

  test('given more pages are loaded then reconnecting reads only the first page again', async () => {
    // Given
    const user = userEvent.setup();
    const users = numberedAdminUsers(ADMIN_USER_PAGE_SIZE * 2 + 3);
    answerAdminApi(fetchMock, { users });
    renderAdminPage();
    await screen.findByRole('button', { name: users[0].email! });
    await user.click(screen.getByRole('button', { name: 'Load more' }));
    await screen.findByRole('button', { name: users[ADMIN_USER_PAGE_SIZE].email! });
    await user.click(screen.getByRole('button', { name: 'Load more' }));
    await screen.findByRole('button', { name: users.at(-1)!.email! });
    const listReadsBefore = listReads().length;

    // When
    await reconnect();
    await letRetriesRun();

    // Then
    expect(listReads().slice(listReadsBefore)).toEqual([
      `GET /v2/admin/users?offset=0&limit=${ADMIN_USER_PAGE_SIZE}`,
    ]);
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

  test('given another admin demotes the signed-in admin then the page becomes not found', async () => {
    // Given
    await openUserDetails(GRACE.email!, {}, createProductionLikeQueryClient());
    answerAsDemotedAdmin(fetchMock);

    // When
    await returnToWindow();

    // Then
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });

  test('given an admin route refuses with 403 then the read is not retried', async () => {
    // Given
    answerAdminApi(fetchMock);
    renderAdminPage({ queryClient: createProductionLikeQueryClient() });
    await screen.findByRole('button', { name: GRACE.email! });
    const listReadsBefore = listReads().length;
    answerAsDemotedAdmin(fetchMock);

    // When
    await returnToWindow();
    await letRetriesRun();

    // Then
    expect(listReads().length - listReadsBefore).toBe(1);
  });

  test('given the list fails once with a server error then it is read again and shows', async () => {
    // Given
    answerAdminApi(fetchMock);
    const answerAsTheApi = fetchMock.getMockImplementation()!;
    let listFailuresLeft = 1;
    fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
      if (new URL(url).pathname === '/v2/admin/users' && listFailuresLeft > 0) {
        listFailuresLeft -= 1;
        return errorResponse(503, 'Saved work is temporarily unavailable.');
      }
      return answerAsTheApi(url, init);
    });

    // When
    renderAdminPage({ queryClient: createProductionLikeQueryClient() });

    // Then
    expect(await screen.findByRole('button', { name: GRACE.email! })).toBeInTheDocument();
  });

  test('given the open user is deleted then the details say the user no longer exists', async () => {
    // Given
    const { apiState } = await openUserDetails(GRACE.email!);
    apiState.users.splice(
      apiState.users.findIndex((candidate) => candidate.id === GRACE.id),
      1
    );

    // When
    await returnToWindow();

    // Then
    expect(await screen.findByText('This user no longer exists.')).toHaveAttribute(
      'role',
      'status'
    );
    expect(screen.queryByRole('button', { name: 'Change type' })).not.toBeInTheDocument();
  });

  test('given the open user is deleted then its read is not retried', async () => {
    // Given
    const { apiState } = await openUserDetails(GRACE.email!, {}, createProductionLikeQueryClient());
    apiState.users.splice(
      apiState.users.findIndex((candidate) => candidate.id === GRACE.id),
      1
    );
    const userReadsBefore = readsOfUser(GRACE.id).length;

    // When
    await returnToWindow();
    await letRetriesRun();

    // Then
    expect(readsOfUser(GRACE.id).length - userReadsBefore).toBe(1);
  });

  test('given the change is saved then the dialog closes without waiting for other reads', async () => {
    // Given
    const { user } = await openUserDetails(GRACE.email!);
    const confirmation = await askToChangeTypeAndWaitForTheCheck(user, 'Author');
    const { answerHeldRequests } = holdRequests(fetchMock, (method) => method === 'GET');

    // When
    await user.click(within(confirmation).getByRole('button', { name: 'Confirm change' }));

    // Then
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    answerHeldRequests();
  });

  test('given the change is saved then the list shows the new type at once', async () => {
    // Given
    const { user } = await openUserDetails(GRACE.email!);
    const confirmation = await askToChangeTypeAndWaitForTheCheck(user, 'Author');
    const { answerHeldRequests } = holdRequests(fetchMock, (method) => method === 'GET');

    // When
    await user.click(within(confirmation).getByRole('button', { name: 'Confirm change' }));

    // Then
    // `hidden`: while the dialog is open the rest of the page is hidden from the accessibility tree.
    const graceRow = screen
      .getByRole('button', { name: GRACE.email!, hidden: true })
      .closest('tr')!;
    await waitFor(() => expect(within(graceRow).getByText('Author')).toBeInTheDocument());
    answerHeldRequests();
  });

  test('given an admin changes another user then /v2/me is not read again', async () => {
    // Given
    const { user } = await openUserDetails(GRACE.email!);
    const confirmation = await askToChangeTypeAndWaitForTheCheck(user, 'Author');
    const meReadsBefore = meReads().length;

    // When
    await user.click(within(confirmation).getByRole('button', { name: 'Confirm change' }));
    await screen.findByText('Standard to Author');
    await letPendingWorkRun();

    // Then
    expect(meReads().length).toBe(meReadsBefore);
  });

  test('given an admin changes their own type then /v2/me is read again', async () => {
    // Given
    const { user } = await openUserDetails(SIGNED_IN_ADMIN.email!, {
      users: [SIGNED_IN_ADMIN_USER, GRACE],
    });
    const confirmation = await askToChangeTypeAndWaitForTheCheck(user, 'Standard');
    const meReadsBefore = meReads().length;

    // When
    await user.click(within(confirmation).getByRole('button', { name: 'Confirm change' }));

    // Then
    await waitFor(() => expect(meReads().length).toBe(meReadsBefore + 1));
  });

  test('given more pages are loaded then returning to the window reads only the first page again, and load more continues after it', async () => {
    // Given
    const user = userEvent.setup();
    const users = numberedAdminUsers(ADMIN_USER_PAGE_SIZE * 2 + 3);
    answerAdminApi(fetchMock, { users });
    renderAdminPage();
    await screen.findByRole('button', { name: users[0].email! });
    await user.click(screen.getByRole('button', { name: 'Load more' }));
    await screen.findByRole('button', { name: users[ADMIN_USER_PAGE_SIZE].email! });
    await user.click(screen.getByRole('button', { name: 'Load more' }));
    await screen.findByRole('button', { name: users.at(-1)!.email! });
    const listReadsBefore = listReads().length;

    // When
    await returnToWindow();
    await letRetriesRun();

    // Then
    expect(listReads().slice(listReadsBefore)).toEqual([
      `GET /v2/admin/users?offset=0&limit=${ADMIN_USER_PAGE_SIZE}`,
    ]);
    await user.click(screen.getByRole('button', { name: 'Load more' }));
    expect(listReads().at(-1)).toBe(
      `GET /v2/admin/users?offset=${ADMIN_USER_PAGE_SIZE}&limit=${ADMIN_USER_PAGE_SIZE}`
    );
  });

  test('given the email field then it takes at most the 320 characters the API accepts', async () => {
    // When
    answerAdminApi(fetchMock);
    renderAdminPage();

    // Then
    expect(await screen.findByRole('searchbox', { name: 'Email' })).toHaveAttribute(
      'maxlength',
      '320'
    );
  });

  test('given the change is saved then focus moves to the chosen type, not the disabled change button', async () => {
    // Given
    const { user } = await openUserDetails(GRACE.email!);
    const confirmation = await askToChangeTypeAndWaitForTheCheck(user, 'Author');

    // When
    await user.click(within(confirmation).getByRole('button', { name: 'Confirm change' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    // Then
    await waitFor(() => expect(screen.getByRole('radio', { name: 'Author' })).toHaveFocus());
  });
});
