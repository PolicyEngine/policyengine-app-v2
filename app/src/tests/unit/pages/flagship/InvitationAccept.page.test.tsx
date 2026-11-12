import { QueryClient } from '@tanstack/react-query';
import { act, cleanup, render, screen, userEvent, waitFor } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { AuthContextValue } from '@/libs/auth/AuthContext';
import {
  readPendingInvitationToken,
  savePendingInvitationToken,
} from '@/libs/invitations/pendingInvitation';
import InvitationAcceptPage from '@/pages/flagship/InvitationAccept.page';
import { sentRequests } from '@/tests/fixtures/api/v2AdminUserMocks';
import {
  acceptanceResponse,
  acceptRefusalResponse,
  answerAcceptanceApi,
  emailNotVerifiedResponse,
  INVITATION_API_MESSAGES,
  INVITATION_TOKEN,
  OTHER_INVITATION_TOKEN,
} from '@/tests/fixtures/api/v2InvitationMocks';
import { deferredResponse, errorResponse, meItemOfType } from '@/tests/fixtures/api/v2UserMocks';
import {
  forgetWindowFocus,
  MeStatusProbe,
  returnToWindow,
  UserSessionProviders,
} from '@/tests/fixtures/hooks/useMeMocks';
import {
  makeAuthValue,
  signedInAuthValue,
  TEST_PROFILE,
} from '@/tests/fixtures/libs/auth/authMocks';

const fetchMock = vi.fn();
const ACCEPT_PAGE_PATH = '/us/invitations/accept';
const STANDARD_USER = meItemOfType('standard');

/** A query client that does not retry reads, and retries mutations without waiting. */
function createAcceptQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retryDelay: 0 } },
  });
}

function renderAcceptPage({
  auth = signedInAuthValue(),
  withMeReader = false,
}: {
  auth?: AuthContextValue;
  /** Also renders a `/v2/me` reader, as the workspace's banner is. */
  withMeReader?: boolean;
} = {}) {
  render(
    <UserSessionProviders
      queryClient={createAcceptQueryClient()}
      session={{ auth, countryId: 'us', pathname: ACCEPT_PAGE_PATH }}
    >
      <InvitationAcceptPage />
      {withMeReader && <MeStatusProbe />}
    </UserSessionProviders>
  );
}

/** Puts the browser on the accept page, as the email's link (or a return to it) opens it. */
function openAcceptPage(fragment = '') {
  window.history.replaceState(null, '', `${ACCEPT_PAGE_PATH}${fragment}`);
}

function acceptRequests(): string[] {
  return sentRequests(fetchMock).filter((request) => request.includes('/invitations/accept'));
}

function meReads(): string[] {
  return sentRequests(fetchMock).filter((request) => request.startsWith('GET /v2/me'));
}

beforeEach(() => {
  localStorage.clear();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  openAcceptPage();
});

afterEach(() => {
  cleanup();
  forgetWindowFocus();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('InvitationAcceptPage', () => {
  test("given a signed-out invitee opens the email's link then the token is kept and leaves the address bar", async () => {
    // Given
    openAcceptPage(`#token=${INVITATION_TOKEN}`);

    // When
    renderAcceptPage({ auth: makeAuthValue() });

    // Then
    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(readPendingInvitationToken()).toBe(INVITATION_TOKEN);
    expect(window.location.hash).toBe('');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('given a signed-out invitee then signing in returns to the accept page', async () => {
    // Given
    const auth = makeAuthValue();
    openAcceptPage(`#token=${INVITATION_TOKEN}`);
    renderAcceptPage({ auth });

    // When
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Sign in' }));

    // Then
    expect(auth.signIn).toHaveBeenCalledWith(ACCEPT_PAGE_PATH);
  });

  test('given a signed-out invitee then creating an account opens sign-up and returns to the accept page', async () => {
    // Given
    const auth = makeAuthValue();
    openAcceptPage(`#token=${INVITATION_TOKEN}`);
    renderAcceptPage({ auth });

    // When
    await userEvent.setup().click(await screen.findByRole('button', { name: 'Create an account' }));

    // Then
    expect(auth.signIn).toHaveBeenCalledWith(ACCEPT_PAGE_PATH, { signUp: true });
  });

  test('given no invitation link was opened then the page says there is nothing to accept', async () => {
    // When
    renderAcceptPage({ auth: makeAuthValue() });

    // Then
    expect(
      await screen.findByRole('heading', { name: 'No invitation to accept' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sign in' })).not.toBeInTheDocument();
  });

  test('given a signed-in invitee then only the token is posted, with the country, without reading /v2/me first', async () => {
    // Given
    savePendingInvitationToken(INVITATION_TOKEN);
    const { acceptBodies } = answerAcceptanceApi(fetchMock, { signedInUser: STANDARD_USER });

    // When
    renderAcceptPage();

    // Then
    expect(
      await screen.findByRole('heading', { name: 'You are now an author' })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Your PolicyEngine account's type changed from Standard to Author.")
    ).toBeInTheDocument();
    expect(sentRequests(fetchMock)).toEqual(['POST /v2/me/invitations/accept?country_id=us']);
    expect(acceptBodies).toEqual([{ token: INVITATION_TOKEN }]);
  });

  test('given the invitation is accepted then the token is dropped and /v2/me is read again', async () => {
    // Given
    savePendingInvitationToken(INVITATION_TOKEN);
    answerAcceptanceApi(fetchMock, { signedInUser: STANDARD_USER });

    // When
    renderAcceptPage({ withMeReader: true });
    await screen.findByRole('heading', { name: 'You are now an author' });

    // Then
    expect(readPendingInvitationToken()).toBeNull();
    await waitFor(() => expect(meReads()).toHaveLength(2));
    expect(sentRequests(fetchMock).at(-1)).toBe('GET /v2/me?country_id=us');
  });

  test('given the user already had the type or a higher one then the page says nothing changed', async () => {
    // Given
    savePendingInvitationToken(INVITATION_TOKEN);
    answerAcceptanceApi(fetchMock, {
      signedInUser: meItemOfType('admin'),
      acceptResponse: () =>
        acceptanceResponse({
          user_type: 'admin',
          previous_user_type: 'admin',
          type_changed: false,
        }),
    });

    // When
    renderAcceptPage();

    // Then
    expect(await screen.findByRole('heading', { name: 'Invitation accepted' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'You are already an admin, which includes everything this invitation gives, so nothing changed.'
      )
    ).toBeInTheDocument();
  });

  test('given the email is not verified then the page asks for the verification email and keeps the token', async () => {
    // Given
    savePendingInvitationToken(INVITATION_TOKEN);
    answerAcceptanceApi(fetchMock, {
      signedInUser: STANDARD_USER,
      acceptResponse: () => emailNotVerifiedResponse(),
    });

    // When
    renderAcceptPage();

    // Then
    expect(
      await screen.findByRole('heading', { name: 'Verify your email address' })
    ).toBeInTheDocument();
    expect(screen.getByText(new RegExp(TEST_PROFILE.email))).toBeInTheDocument();
    expect(readPendingInvitationToken()).toBe(INVITATION_TOKEN);
  });

  test.each([
    ['the tab is shown again', () => returnToWindow()],
    [
      'the window regains focus',
      () =>
        act(async () => {
          window.dispatchEvent(new Event('focus'));
        }),
    ],
  ])(
    'given the email is not verified then accepting is tried again when %s',
    async (_label, comeBack) => {
      // Given
      savePendingInvitationToken(INVITATION_TOKEN);
      let verified = false;
      answerAcceptanceApi(fetchMock, {
        signedInUser: STANDARD_USER,
        acceptResponse: () => (verified ? acceptanceResponse() : emailNotVerifiedResponse()),
      });
      renderAcceptPage();
      await screen.findByRole('heading', { name: 'Verify your email address' });

      // When
      verified = true;
      await comeBack();

      // Then
      expect(
        await screen.findByRole('heading', { name: 'You are now an author' })
      ).toBeInTheDocument();
      expect(acceptRequests()).toHaveLength(2);
    }
  );

  test('given the signed-in address is not the invited one then the page says so and keeps the token', async () => {
    // Given
    savePendingInvitationToken(INVITATION_TOKEN);
    const auth = signedInAuthValue();
    answerAcceptanceApi(fetchMock, {
      signedInUser: STANDARD_USER,
      acceptResponse: () =>
        acceptRefusalResponse(403, 'email_mismatch', INVITATION_API_MESSAGES.EMAIL_MISMATCH),
    });
    renderAcceptPage({ auth });

    // When
    await screen.findByRole('heading', { name: 'This invitation is for another email address' });
    await userEvent.setup().click(screen.getByRole('button', { name: 'Sign out' }));

    // Then
    expect(auth.signOut).toHaveBeenCalled();
    expect(readPendingInvitationToken()).toBe(INVITATION_TOKEN);
  });

  test.each([
    [410, 'invitation_not_found', 'This invitation link no longer works'],
    [410, 'invitation_revoked', 'This invitation link no longer works'],
    [410, 'invitation_expired', 'This invitation has expired'],
    [410, 'invitation_accepted', 'This invitation was already accepted'],
    [409, 'inviter_not_admin', 'This invitation is no longer valid'],
  ] as const)(
    'given the acceptance is refused with %s %s then the page says so and drops the token',
    async (status, code, heading) => {
      // Given
      savePendingInvitationToken(INVITATION_TOKEN);
      answerAcceptanceApi(fetchMock, {
        signedInUser: STANDARD_USER,
        acceptResponse: () => acceptRefusalResponse(status, code),
      });

      // When
      renderAcceptPage();

      // Then
      expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();
      expect(readPendingInvitationToken()).toBeNull();
    }
  );

  test('given a token that is not one (422) then the link is said to no longer work and the token is dropped', async () => {
    // Given
    savePendingInvitationToken(INVITATION_TOKEN);
    answerAcceptanceApi(fetchMock, {
      signedInUser: STANDARD_USER,
      acceptResponse: () => errorResponse(422, 'The request does not match the schema.'),
    });

    // When
    renderAcceptPage();

    // Then
    expect(
      await screen.findByRole('heading', { name: 'This invitation link no longer works' })
    ).toBeInTheDocument();
    expect(readPendingInvitationToken()).toBeNull();
  });

  test('given the invitation was already accepted then /v2/me is read again', async () => {
    // Given
    savePendingInvitationToken(INVITATION_TOKEN);
    answerAcceptanceApi(fetchMock, {
      signedInUser: STANDARD_USER,
      acceptResponse: () => acceptRefusalResponse(410, 'invitation_accepted'),
    });

    // When
    renderAcceptPage({ withMeReader: true });
    await screen.findByRole('heading', { name: 'This invitation was already accepted' });

    // Then
    await waitFor(() => expect(meReads()).toHaveLength(2));
    expect(sentRequests(fetchMock).at(-1)).toBe('GET /v2/me?country_id=us');
  });

  test('given Auth0 cannot be reached once then the acceptance is tried again by itself', async () => {
    // Given
    savePendingInvitationToken(INVITATION_TOKEN);
    let failures = 1;
    answerAcceptanceApi(fetchMock, {
      signedInUser: STANDARD_USER,
      acceptResponse: () => {
        if (failures > 0) {
          failures -= 1;
          return acceptRefusalResponse(
            503,
            'auth0_unavailable',
            INVITATION_API_MESSAGES.AUTH0_UNAVAILABLE
          );
        }
        return acceptanceResponse();
      },
    });

    // When
    renderAcceptPage();

    // Then
    expect(
      await screen.findByRole('heading', { name: 'You are now an author' })
    ).toBeInTheDocument();
    expect(acceptRequests()).toHaveLength(2);
  });

  test('given the acceptance keeps failing then the error shows, the token stays, and trying again accepts it', async () => {
    // Given
    savePendingInvitationToken(INVITATION_TOKEN);
    let available = false;
    answerAcceptanceApi(fetchMock, {
      signedInUser: STANDARD_USER,
      acceptResponse: () =>
        available
          ? acceptanceResponse()
          : acceptRefusalResponse(
              503,
              'auth0_unavailable',
              INVITATION_API_MESSAGES.AUTH0_UNAVAILABLE
            ),
    });
    renderAcceptPage();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      `We could not accept your invitation: ${INVITATION_API_MESSAGES.AUTH0_UNAVAILABLE}`
    );
    expect(readPendingInvitationToken()).toBe(INVITATION_TOKEN);

    // When
    available = true;
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }));

    // Then
    expect(
      await screen.findByRole('heading', { name: 'You are now an author' })
    ).toBeInTheDocument();
  });

  test('given the email is not verified and the invitee comes back by focus and by showing the tab at once then it is posted once more', async () => {
    // Given
    savePendingInvitationToken(INVITATION_TOKEN);
    const heldAnswer = deferredResponse();
    let attempts = 0;
    answerAcceptanceApi(fetchMock, {
      signedInUser: STANDARD_USER,
      acceptResponse: () => {
        attempts += 1;
        return attempts === 1 ? emailNotVerifiedResponse() : heldAnswer.response;
      },
    });
    renderAcceptPage();
    await screen.findByRole('heading', { name: 'Verify your email address' });

    // When
    await act(async () => {
      window.dispatchEvent(new Event('focus'));
    });
    await returnToWindow();
    heldAnswer.answer(acceptanceResponse());

    // Then
    expect(
      await screen.findByRole('heading', { name: 'You are now an author' })
    ).toBeInTheDocument();
    expect(acceptRequests()).toHaveLength(2);
  });

  test('given a newer link is opened while storage keeps an older token but cannot be written then the newer token is posted', async () => {
    // Given
    savePendingInvitationToken(OTHER_INVITATION_TOKEN);
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('Storage is full');
    });
    openAcceptPage(`#token=${INVITATION_TOKEN}`);
    const { acceptBodies } = answerAcceptanceApi(fetchMock, { signedInUser: STANDARD_USER });

    // When
    renderAcceptPage();

    // Then
    expect(
      await screen.findByRole('heading', { name: 'You are now an author' })
    ).toBeInTheDocument();
    expect(acceptBodies).toEqual([{ token: INVITATION_TOKEN }]);
  });

  test("given storage is blocked then the link's own token is still accepted", async () => {
    // Given
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('Storage is blocked');
    });
    openAcceptPage(`#token=${INVITATION_TOKEN}`);
    const { acceptBodies } = answerAcceptanceApi(fetchMock, { signedInUser: STANDARD_USER });

    // When
    renderAcceptPage();

    // Then
    expect(
      await screen.findByRole('heading', { name: 'You are now an author' })
    ).toBeInTheDocument();
    expect(acceptBodies).toEqual([{ token: INVITATION_TOKEN }]);
  });
});
