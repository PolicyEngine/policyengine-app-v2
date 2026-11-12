import { cleanup, render, screen, userEvent, waitFor, within } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ADMIN_USER_PAGE_SIZE } from '@/hooks/useAdminUsers';
import AdminUsersPage from '@/pages/flagship/AdminUsers.page';
import { publicApiPathOf } from '@/tests/fixtures/api/publicApiRouteMocks';
import {
  ADMIN_API_MESSAGES,
  ALAN,
  answerAdminApi,
  answerAsDemotedAdmin,
  auth0UsersLeftMessage,
  GRACE,
  holdRequests,
  numberedAdminUsers,
  sentRequests,
  SIGNED_IN_ADMIN_USER,
  UNNAMED_USER,
  type FakeAdminApiOptions,
} from '@/tests/fixtures/api/v2AdminUserMocks';
import { errorResponse, ROUTE_MESSAGES } from '@/tests/fixtures/api/v2UserMocks';
import {
  createTestQueryClient,
  forgetWindowFocus,
  letPendingWorkRun,
  returnToWindow,
  UserSessionProviders,
} from '@/tests/fixtures/hooks/useMeMocks';
import { signedInAuthValue } from '@/tests/fixtures/libs/auth/authMocks';

const fetchMock = vi.fn();

/** What the details say once the open user's account is deleted. */
const ACCOUNT_DELETED_TEXT = "This user's account was deleted.";

function renderAdminPage() {
  return render(
    <UserSessionProviders
      queryClient={createTestQueryClient()}
      session={{ auth: signedInAuthValue(), countryId: 'us' }}
    >
      <AdminUsersPage />
    </UserSessionProviders>
  );
}

/** Renders the page as an admin and opens the details of the user listed as `listedLabel`. */
async function openUserDetails(listedLabel: string, options: FakeAdminApiOptions = {}) {
  const user = userEvent.setup();
  const apiState = answerAdminApi(fetchMock, options);
  renderAdminPage();
  await user.click(await screen.findByRole('button', { name: listedLabel }));
  await screen.findByRole('radiogroup', { name: 'User type' });
  return { user, apiState };
}

/** Asks to delete the open user's account and returns the confirmation. */
async function askToDeleteAccount(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Delete account' }));
  return screen.findByRole('dialog');
}

/** Opens `GRACE`'s details and confirms the deletion of her account. */
async function deleteGracesAccount(options: FakeAdminApiOptions = {}) {
  const opened = await openUserDetails(GRACE.email!, options);
  const confirmation = await askToDeleteAccount(opened.user);
  await opened.user.click(within(confirmation).getByRole('button', { name: 'Delete account' }));
  return { ...opened, confirmation };
}

function deleteRequests(): string[] {
  return sentRequests(fetchMock).filter((request) => request.startsWith('DELETE'));
}

function listReads(): string[] {
  return sentRequests(fetchMock).filter((request) => request.startsWith('GET /v2/admin/users?'));
}

function readsOfUser(userId: string): string[] {
  return sentRequests(fetchMock).filter((request) => request === `GET /v2/admin/users/${userId}`);
}

function isListRead(method: string, path: string): boolean {
  return method === 'GET' && path === '/v2/admin/users';
}

/** Lets queued work run several times over, long enough for answers to be shown. */
async function letQueuedWorkRun() {
  for (let round = 0; round < 10; round += 1) {
    await letPendingWorkRun();
  }
}

/**
 * Answers every later DELETE at once, as the API then would, but holds the
 * answer back until the test calls `deliverHeldAnswers`: a deletion whose
 * data is gone while its answer is still on its way.
 */
function holdAnswersOfDeletions() {
  const answerAsBefore = fetchMock.getMockImplementation()!;
  const heldDeliveries: Array<() => void> = [];
  fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
    if ((init.method ?? 'GET') !== 'DELETE') {
      return answerAsBefore(url, init);
    }
    const answer = await answerAsBefore(url, init);
    return new Promise<Response>((resolve) => {
      heldDeliveries.push(() => resolve(answer));
    });
  });
  return { deliverHeldAnswers: () => heldDeliveries.splice(0).forEach((deliver) => deliver()) };
}

/** Makes every later read of the list fail with a server error, and other requests answer as before. */
function failListReads() {
  const answerAsBefore = fetchMock.getMockImplementation()!;
  fetchMock.mockImplementation(async (url: string, init: RequestInit) =>
    isListRead(init.method ?? 'GET', publicApiPathOf(url))
      ? errorResponse(500, ADMIN_API_MESSAGES.OPERATION_FAILED)
      : answerAsBefore(url, init)
  );
  return { answerListReadsAgain: () => fetchMock.mockImplementation(answerAsBefore) };
}

/** The list of users, also while a dialog hides the rest of the page from assistive technology. */
function usersTable() {
  return screen.getByRole('table', { name: 'Users', hidden: true });
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  cleanup();
  forgetWindowFocus();
  vi.unstubAllGlobals();
});

describe('AdminUsersPage account deletion', () => {
  test("given another user's details then they offer to delete the user's account", async () => {
    // When
    await openUserDetails(GRACE.email!);

    // Then
    expect(screen.getByRole('button', { name: 'Delete account' })).toBeEnabled();
  });

  test("given the signed-in admin's own details then deletion is not offered and the account page is linked", async () => {
    // When
    await openUserDetails(SIGNED_IN_ADMIN_USER.email!, { users: [SIGNED_IN_ADMIN_USER, GRACE] });

    // Then
    expect(screen.queryByRole('button', { name: 'Delete account' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'account page' })).toHaveAttribute(
      'href',
      '/us/account'
    );
  });

  test('given the confirmation then it names the user and says their saved items and sign-in account cannot be restored', async () => {
    // Given
    const { user } = await openUserDetails(GRACE.email!);

    // When
    const confirmation = await askToDeleteAccount(user);

    // Then
    expect(confirmation).toHaveAccessibleName("Delete this user's account?");
    expect(confirmation).toHaveAccessibleDescription(
      'This deletes the account of grace@example.org (Grace Hopper), their saved items and ' +
        'their sign-in account. They cannot be restored.'
    );
    expect(deleteRequests()).toEqual([]);
  });

  test('given a user with no email or name then the confirmation names their ID', async () => {
    // Given
    const { user } = await openUserDetails('No email', { users: [UNNAMED_USER] });

    // When
    const confirmation = await askToDeleteAccount(user);

    // Then
    expect(confirmation).toHaveAccessibleDescription(
      `This deletes the account of ${UNNAMED_USER.id}, their saved items and their sign-in ` +
        'account. They cannot be restored.'
    );
  });

  test('given the confirmation is cancelled then nothing is deleted and focus returns to "Delete account"', async () => {
    // Given
    const { user } = await openUserDetails(GRACE.email!);
    const confirmation = await askToDeleteAccount(user);

    // When
    await user.click(within(confirmation).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    // Then
    expect(deleteRequests()).toEqual([]);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Delete account' })).toHaveFocus()
    );
  });

  test('given the deletion is confirmed then the user is deleted and leaves the list and the details', async () => {
    // When
    await deleteGracesAccount();

    // Then
    expect(await screen.findByText(ACCOUNT_DELETED_TEXT)).toHaveAttribute('role', 'status');
    expect(deleteRequests()).toEqual([`DELETE /v2/admin/users/${GRACE.id}`]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('radiogroup', { name: 'User type' })).not.toBeInTheDocument();
    expect(
      within(usersTable()).queryByRole('button', { name: GRACE.email! })
    ).not.toBeInTheDocument();
    expect(within(usersTable()).getByRole('button', { name: ALAN.email! })).toBeInTheDocument();
  });

  test('given the deletion is confirmed then the user leaves the list before the list is read again', async () => {
    // Given
    const { user } = await openUserDetails(GRACE.email!);
    const { heldRequestCount } = holdRequests(fetchMock, isListRead);
    const confirmation = await askToDeleteAccount(user);

    // When
    await user.click(within(confirmation).getByRole('button', { name: 'Delete account' }));
    await screen.findByText(ACCOUNT_DELETED_TEXT);

    // Then
    await waitFor(() => expect(heldRequestCount()).toBe(1));
    expect(
      within(usersTable()).queryByRole('button', { name: GRACE.email! })
    ).not.toBeInTheDocument();
    expect(within(usersTable()).getByRole('button', { name: ALAN.email! })).toBeInTheDocument();
  });

  test('given the deletion is confirmed then focus moves to the details heading', async () => {
    // When
    await deleteGracesAccount();
    await screen.findByText(ACCOUNT_DELETED_TEXT);

    // Then
    await waitFor(() => expect(screen.getByRole('heading', { name: GRACE.email! })).toHaveFocus());
  });

  test('given more pages are loaded then a deletion reads only the first page again, and load more continues after it', async () => {
    // Given
    const users = numberedAdminUsers(ADMIN_USER_PAGE_SIZE * 2 + 3);
    const deletedUser = users[1];
    const { user } = await openUserDetails(deletedUser.email!, { users });
    await user.click(screen.getByRole('button', { name: 'Load more' }));
    await screen.findByRole('button', { name: users[ADMIN_USER_PAGE_SIZE].email! });
    const listReadsBefore = listReads().length;

    // When
    const confirmation = await askToDeleteAccount(user);
    await user.click(within(confirmation).getByRole('button', { name: 'Delete account' }));
    await screen.findByText(ACCOUNT_DELETED_TEXT);

    // Then
    await waitFor(() =>
      expect(listReads().slice(listReadsBefore)).toEqual([
        `GET /v2/admin/users?offset=0&limit=${ADMIN_USER_PAGE_SIZE}`,
      ])
    );
    await user.click(await screen.findByRole('button', { name: 'Load more' }));
    expect(listReads().at(-1)).toBe(
      `GET /v2/admin/users?offset=${ADMIN_USER_PAGE_SIZE}&limit=${ADMIN_USER_PAGE_SIZE}`
    );
    expect(
      within(usersTable()).queryByRole('button', { name: deletedUser.email! })
    ).not.toBeInTheDocument();
  });

  test.each([
    ['Auth0 deletion is unavailable', 503, ADMIN_API_MESSAGES.ACCOUNT_DELETION_UNAVAILABLE, false],
    ['the API refuses with a conflict', 409, ADMIN_API_MESSAGES.LAST_ADMIN_DELETION, false],
    ['the deletion fails', 500, ADMIN_API_MESSAGES.OPERATION_FAILED, false],
    [
      "the calculator's route cannot reach the Public API",
      502,
      ROUTE_MESSAGES.PUBLIC_API_UNREACHABLE,
      true,
    ],
  ])(
    "given %s then the confirmation shows the answer's message and the user stays",
    async (_reason, status, message, writtenByRoute) => {
      // When
      const { confirmation } = await deleteGracesAccount({
        deleteRefusal: { status, message, writtenByRoute },
      });

      // Then
      expect(await within(confirmation).findByRole('alert')).toHaveTextContent(message);
      expect(screen.queryByText(ACCOUNT_DELETED_TEXT)).not.toBeInTheDocument();
      expect(within(confirmation).getByRole('button', { name: 'Delete account' })).toBeEnabled();
      expect(
        within(usersTable()).getByRole('button', { name: GRACE.email!, hidden: true })
      ).toBeInTheDocument();
    }
  );

  test('given Auth0 deletion is unavailable then trying again later deletes the account', async () => {
    // Given
    const { user, confirmation } = await deleteGracesAccount({
      deleteRefusal: { status: 503, message: ADMIN_API_MESSAGES.ACCOUNT_DELETION_UNAVAILABLE },
    });
    await within(confirmation).findByRole('alert');
    answerAdminApi(fetchMock);

    // When
    await user.click(within(confirmation).getByRole('button', { name: 'Delete account' }));

    // Then
    expect(await screen.findByText(ACCOUNT_DELETED_TEXT)).toBeInTheDocument();
    expect(deleteRequests()).toHaveLength(2);
  });

  test("given the data is deleted but some Auth0 users are not then the details show the API's message and the user's email", async () => {
    // Given
    const message = auth0UsersLeftMessage(1, 2);

    // When
    await deleteGracesAccount({ auth0DeletionFailure: message });

    // Then
    expect(await screen.findByText(ACCOUNT_DELETED_TEXT)).toBeInTheDocument();
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(message);
    expect(alert).toHaveTextContent(`This user's email was ${GRACE.email}.`);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      within(usersTable()).queryByRole('button', { name: GRACE.email! })
    ).not.toBeInTheDocument();
  });

  test('given the user is read while the deletion is under way then the deletion still says what happened', async () => {
    // Given
    const message = auth0UsersLeftMessage(1, 1);
    const { user } = await openUserDetails(GRACE.email!, { auth0DeletionFailure: message });
    const { deliverHeldAnswers } = holdAnswersOfDeletions();
    const confirmation = await askToDeleteAccount(user);
    await user.click(within(confirmation).getByRole('button', { name: 'Delete account' }));
    await waitFor(() => expect(deleteRequests()).toHaveLength(1));
    const userReadsBefore = readsOfUser(GRACE.id).length;

    // When
    // The data is gone, so this read finds no user, while the Auth0 deletions are still running.
    await returnToWindow();
    await waitFor(() => expect(readsOfUser(GRACE.id).length).toBe(userReadsBefore + 1));
    await letQueuedWorkRun();
    deliverHeldAnswers();

    // Then
    expect(await screen.findByText(ACCOUNT_DELETED_TEXT)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(message);
  });

  test('given the last read of the list failed for a while then the deletion still takes the user out of it', async () => {
    // Given
    const { user } = await openUserDetails(GRACE.email!);
    const { answerListReadsAgain } = failListReads();
    const listReadsBefore = listReads().length;
    await returnToWindow();
    await waitFor(() => expect(listReads().length).toBe(listReadsBefore + 1));
    await letQueuedWorkRun();
    expect(within(usersTable()).getByRole('button', { name: GRACE.email! })).toBeInTheDocument();
    answerListReadsAgain();
    holdRequests(fetchMock, isListRead);
    const confirmation = await askToDeleteAccount(user);

    // When
    await user.click(within(confirmation).getByRole('button', { name: 'Delete account' }));
    await screen.findByText(ACCOUNT_DELETED_TEXT);

    // Then
    expect(
      within(usersTable()).queryByRole('button', { name: GRACE.email! })
    ).not.toBeInTheDocument();
  });

  test('given another admin deleted the user first then the details say the user no longer exists and the list drops them', async () => {
    // Given
    const { user, apiState } = await openUserDetails(GRACE.email!);
    const confirmation = await askToDeleteAccount(user);
    apiState.users.splice(
      apiState.users.findIndex((listedUser) => listedUser.id === GRACE.id),
      1
    );

    // When
    await user.click(within(confirmation).getByRole('button', { name: 'Delete account' }));

    // Then
    expect(await screen.findByText('This user no longer exists.')).toBeInTheDocument();
    await waitFor(() =>
      expect(
        within(usersTable()).queryByRole('button', { name: GRACE.email! })
      ).not.toBeInTheDocument()
    );
  });

  test('given the admin was demoted then the deletion is refused and the page becomes not found', async () => {
    // Given
    const { user } = await openUserDetails(GRACE.email!);
    const confirmation = await askToDeleteAccount(user);
    answerAsDemotedAdmin(fetchMock);

    // When
    await user.click(within(confirmation).getByRole('button', { name: 'Delete account' }));

    // Then
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });

  test('given the deletion is under way then the confirmation can be neither closed nor sent again', async () => {
    // Given
    const { user } = await openUserDetails(GRACE.email!);
    const { answerHeldRequests } = holdRequests(fetchMock, (method) => method === 'DELETE');
    const confirmation = await askToDeleteAccount(user);

    // When
    await user.click(within(confirmation).getByRole('button', { name: 'Delete account' }));
    await user.keyboard('{Escape}');

    // Then
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(within(confirmation).getByRole('button', { name: 'Cancel' })).toBeDisabled();
    // Named "Loading... Delete account" while its spinner shows.
    expect(within(confirmation).getByRole('button', { name: /Delete account/ })).toBeDisabled();
    expect(deleteRequests()).toHaveLength(1);
    answerHeldRequests();
    expect(await screen.findByText(ACCOUNT_DELETED_TEXT)).toBeInTheDocument();
  });
});
