import { act, cleanup, render, screen, userEvent, waitFor, within } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import AdminUsersPage from '@/pages/flagship/AdminUsers.page';
import { publicApiPathOf } from '@/tests/fixtures/api/publicApiRouteMocks';
import {
  ADMIN_API_MESSAGES,
  holdRequests,
  sentRequests,
} from '@/tests/fixtures/api/v2AdminUserMocks';
import {
  ALAN_INVITATION,
  answerInvitationApi,
  GRACE_INVITATION,
  type FakeInvitationApiOptions,
} from '@/tests/fixtures/api/v2InvitationMocks';
import { errorResponse } from '@/tests/fixtures/api/v2UserMocks';
import {
  createTestQueryClient,
  forgetWindowFocus,
  letPendingWorkRun,
  UserSessionProviders,
} from '@/tests/fixtures/hooks/useMeMocks';
import { signedInAuthValue } from '@/tests/fixtures/libs/auth/authMocks';

const fetchMock = vi.fn();

const NEW_INVITEE_EMAIL = 'katherine@example.org';

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

/** Renders the admin page as an admin and opens its invitations tab. */
async function openInvitations(options: FakeInvitationApiOptions = {}) {
  const user = userEvent.setup();
  const apiState = answerInvitationApi(fetchMock, options);
  renderAdminPage();
  await user.click(await screen.findByRole('tab', { name: 'Invitations' }));
  return { user, apiState };
}

function invitationRequests(): string[] {
  return sentRequests(fetchMock).filter((request) => request.includes('/v2/admin/invitations'));
}

function invitationsTable() {
  return screen.findByRole('table', { name: 'Pending invitations' });
}

/** The row of the pending invitation to `email`. */
async function invitationRow(email: string) {
  const table = await invitationsTable();
  return within(table).getByText(email).closest('tr')!;
}

async function sendInvitation(
  user: ReturnType<typeof userEvent.setup>,
  email: string,
  typeLabel: 'Author' | 'Admin'
) {
  await user.type(screen.getByRole('textbox', { name: 'Email address' }), email);
  await user.click(screen.getByRole('radio', { name: typeLabel }));
  await user.click(screen.getByRole('button', { name: 'Send invitation' }));
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

describe('AdminInvitations', () => {
  test('given the admin page opens on its users then no invitations are requested', async () => {
    // Given
    answerInvitationApi(fetchMock);

    // When
    renderAdminPage();
    await screen.findByRole('table', { name: 'Users' });
    await letPendingWorkRun();

    // Then
    expect(invitationRequests()).toEqual([]);
  });

  test('given a user search then going to the invitations and back keeps the search and its users', async () => {
    // Given
    const user = userEvent.setup();
    answerInvitationApi(fetchMock);
    renderAdminPage();
    await user.type(await screen.findByRole('searchbox', { name: 'Email' }), 'grace');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() =>
      expect(within(screen.getByRole('table', { name: 'Users' })).getAllByRole('row')).toHaveLength(
        2
      )
    );

    // When
    await user.click(screen.getByRole('tab', { name: 'Invitations' }));
    await invitationsTable();
    await user.click(screen.getByRole('tab', { name: 'Find users' }));

    // Then
    expect(screen.getByRole('searchbox', { name: 'Email' })).toHaveValue('grace');
    expect(within(screen.getByRole('table', { name: 'Users' })).getAllByRole('row')).toHaveLength(
      2
    );
  });

  test('given open invitations then the tab lists each with its type, last send and expiry', async () => {
    // When
    await openInvitations();

    // Then
    const graceRow = await invitationRow(GRACE_INVITATION.email);
    expect(within(graceRow).getByText('Author')).toBeInTheDocument();
    expect(within(graceRow).getByText('Nov 12, 2026')).toBeInTheDocument();
    expect(within(graceRow).getByText('Nov 19, 2026')).toBeInTheDocument();
    const alanRow = await invitationRow(ALAN_INVITATION.email);
    expect(within(alanRow).getByText('Admin')).toBeInTheDocument();
    expect(within(alanRow).getByText('Not sent')).toBeInTheDocument();
  });

  test('given the last email of an invitation failed to send then its row says so', async () => {
    // When
    await openInvitations();

    // Then
    const alanRow = await invitationRow(ALAN_INVITATION.email);
    expect(within(alanRow).getByText(/The last email could not be sent/)).toHaveTextContent(
      'The last email could not be sent: Postmark does not send to this address, because earlier email to it bounced or was marked as spam.'
    );
    const graceRow = await invitationRow(GRACE_INVITATION.email);
    expect(within(graceRow).queryByText(/could not be sent/)).not.toBeInTheDocument();
  });

  test('given an expired invitation then its row says to resend it', async () => {
    // When
    await openInvitations({ invitations: [{ ...GRACE_INVITATION, expired: true }] });

    // Then
    const graceRow = await invitationRow(GRACE_INVITATION.email);
    expect(
      within(graceRow).getByText('Expired: resend it to send a new link.')
    ).toBeInTheDocument();
  });

  test('given no pending invitations then the tab says so', async () => {
    // When
    await openInvitations({ invitations: [] });

    // Then
    expect(await screen.findByText('No pending invitations.')).toBeInTheDocument();
  });

  test('given an address and a type then sending posts them and lists the invitation first', async () => {
    // Given
    const { user } = await openInvitations();
    await invitationsTable();

    // When
    await sendInvitation(user, `  ${NEW_INVITEE_EMAIL} `, 'Admin');

    // Then
    expect(await screen.findByText(`Invitation sent to ${NEW_INVITEE_EMAIL}.`)).toHaveAttribute(
      'role',
      'status'
    );
    const postBodies = fetchMock.mock.calls
      .filter(
        ([url, init]) => init.method === 'POST' && publicApiPathOf(url) === '/v2/admin/invitations'
      )
      .map(([, init]) => JSON.parse(init.body));
    expect(postBodies).toEqual([{ email: NEW_INVITEE_EMAIL, user_type: 'admin' }]);
    const rows = within(await invitationsTable()).getAllByRole('row');
    expect(within(rows[1]).getByText(NEW_INVITEE_EMAIL)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Email address' })).toHaveValue('');
  });

  test('given the email of a new invitation fails to send then the admin is told to resend it', async () => {
    // Given
    const { user } = await openInvitations({ sendError: 'not_configured' });
    await invitationsTable();

    // When
    await sendInvitation(user, NEW_INVITEE_EMAIL, 'Author');

    // Then
    expect(await screen.findByRole('alert')).toHaveTextContent(
      `The invitation to ${NEW_INVITEE_EMAIL} was saved, but its email could not be sent: sending email is not set up yet. Resend it from the list.`
    );
  });

  test('given the API refuses an invitation then its message shows and the address stays', async () => {
    // Given
    const { user } = await openInvitations();
    await invitationsTable();
    const answerAsBefore = fetchMock.getMockImplementation()!;
    fetchMock.mockImplementation(async (url: string, init: RequestInit) =>
      init.method === 'POST' && publicApiPathOf(url) === '/v2/admin/invitations'
        ? errorResponse(422, 'The request does not match the schema.')
        : answerAsBefore(url, init)
    );

    // When
    await sendInvitation(user, NEW_INVITEE_EMAIL, 'Author');

    // Then
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We could not send the invitation: The request does not match the schema.'
    );
    expect(screen.getByRole('textbox', { name: 'Email address' })).toHaveValue(NEW_INVITEE_EMAIL);
  });

  test('given an invitation whose email failed then resending it sends it again and clears the note', async () => {
    // Given
    const { user } = await openInvitations();
    const alanRow = await invitationRow(ALAN_INVITATION.email);

    // When
    await user.click(within(alanRow).getByRole('button', { name: 'Resend' }));

    // Then
    expect(
      await screen.findByText(`Invitation sent again to ${ALAN_INVITATION.email}.`)
    ).toHaveAttribute('role', 'status');
    expect(invitationRequests()).toContain(
      `POST /v2/admin/invitations/${ALAN_INVITATION.id}/resend`
    );
    await waitFor(async () =>
      expect(
        within(await invitationRow(ALAN_INVITATION.email)).queryByText(/could not be sent/)
      ).not.toBeInTheDocument()
    );
  });

  test('given a pending invitation then revoking it deletes it and removes it from the list', async () => {
    // Given
    const { user } = await openInvitations();
    const graceRow = await invitationRow(GRACE_INVITATION.email);

    // When
    await user.click(within(graceRow).getByRole('button', { name: 'Revoke' }));

    // Then
    expect(
      await screen.findByText(`The invitation to ${GRACE_INVITATION.email} was revoked.`)
    ).toHaveAttribute('role', 'status');
    expect(invitationRequests()).toContain(`DELETE /v2/admin/invitations/${GRACE_INVITATION.id}`);
    expect(
      within(await invitationsTable()).queryByText(GRACE_INVITATION.email)
    ).not.toBeInTheDocument();
  });

  test('given an invitation is no longer open then resending it says so and the list is read again', async () => {
    // Given
    const { user, apiState } = await openInvitations();
    const graceRow = await invitationRow(GRACE_INVITATION.email);
    apiState.invitations = apiState.invitations.filter(
      (invitation) => invitation.id !== GRACE_INVITATION.id
    );

    // When
    await user.click(within(graceRow).getByRole('button', { name: 'Resend' }));

    // Then
    expect(await screen.findByRole('alert')).toHaveTextContent(
      `The invitation to ${GRACE_INVITATION.email} is no longer open: it may have been accepted or revoked.`
    );
    await waitFor(async () =>
      expect(
        within(await invitationsTable()).queryByText(GRACE_INVITATION.email)
      ).not.toBeInTheDocument()
    );
  });

  test('given two rows are resent at once then each row waits for its own request and each outcome shows', async () => {
    // Given
    const { user } = await openInvitations();
    const { answerHeldRequests } = holdRequests(
      fetchMock,
      (method, path) => method === 'POST' && path.endsWith('/resend')
    );
    const alanRow = await invitationRow(ALAN_INVITATION.email);
    const graceRow = await invitationRow(GRACE_INVITATION.email);

    // When
    await user.click(within(alanRow).getByRole('button', { name: 'Resend' }));
    await user.click(within(graceRow).getByRole('button', { name: 'Resend' }));

    // Then
    expect(within(alanRow).getByRole('button', { name: 'Resend' })).toBeDisabled();
    expect(within(graceRow).getByRole('button', { name: 'Revoke' })).toBeDisabled();
    await act(async () => answerHeldRequests());
    expect(
      await screen.findByText(`Invitation sent again to ${ALAN_INVITATION.email}.`)
    ).toBeInTheDocument();
    expect(
      screen.getByText(`Invitation sent again to ${GRACE_INVITATION.email}.`)
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(within(alanRow).getByRole('button', { name: 'Resend' })).toBeEnabled()
    );
  });

  test('given the invitations cannot be read then trying again shows them', async () => {
    // Given
    const user = userEvent.setup();
    answerInvitationApi(fetchMock);
    const answerAsBefore = fetchMock.getMockImplementation()!;
    let failListRead = true;
    fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
      if (
        failListRead &&
        (init.method ?? 'GET') === 'GET' &&
        publicApiPathOf(url) === '/v2/admin/invitations'
      ) {
        failListRead = false;
        return errorResponse(500, 'The operation could not be completed.');
      }
      return answerAsBefore(url, init);
    });
    renderAdminPage();
    await user.click(await screen.findByRole('tab', { name: 'Invitations' }));

    // When
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We could not load the invitations: The operation could not be completed.'
    );
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    // Then
    expect(await invitationRow(GRACE_INVITATION.email)).toBeInTheDocument();
  });

  test('given a revocation is refused then the refusal names the invitation', async () => {
    // Given
    const { user } = await openInvitations();
    const graceRow = await invitationRow(GRACE_INVITATION.email);
    const answerAsBefore = fetchMock.getMockImplementation()!;
    fetchMock.mockImplementation(async (url: string, init: RequestInit) =>
      init.method === 'DELETE'
        ? errorResponse(403, ADMIN_API_MESSAGES.ADMINS_ONLY)
        : answerAsBefore(url, init)
    );

    // When
    await user.click(within(graceRow).getByRole('button', { name: 'Revoke' }));

    // Then
    expect(await screen.findByRole('alert')).toHaveTextContent(
      `We could not revoke the invitation to ${GRACE_INVITATION.email}: Only admins may use these routes.`
    );
  });
});
