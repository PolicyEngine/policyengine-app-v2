import { QueryClient } from '@tanstack/react-query';
import { cleanup, render, screen, userEvent, waitFor } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { meQueryKey } from '@/hooks/useMe';
import type { AuthContextValue } from '@/libs/auth/AuthContext';
import {
  readPendingInvitationToken,
  savePendingInvitationToken,
} from '@/libs/invitations/pendingInvitation';
import InvitationAcceptPage from '@/pages/flagship/InvitationAccept.page';
import { publicApiPathOf } from '@/tests/fixtures/api/publicApiRouteMocks';
import { sentRequests } from '@/tests/fixtures/api/v2AdminUserMocks';
import {
  answerAcceptanceApi,
  emailNotVerifiedResponse,
  INVITATION_API_MESSAGES,
  INVITATION_TOKEN,
  latestTypeChange,
} from '@/tests/fixtures/api/v2InvitationMocks';
import { errorResponse, meItemOfType, okResponse } from '@/tests/fixtures/api/v2UserMocks';
import {
  forgetWindowFocus,
  letPendingWorkRun,
  returnToWindow,
  UserSessionProviders,
} from '@/tests/fixtures/hooks/useMeMocks';
import {
  makeAuthValue,
  signedInAuthValue,
  TEST_AUTH0_SUBJECT,
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
  queryClient = createAcceptQueryClient(),
}: { auth?: AuthContextValue; queryClient?: QueryClient } = {}) {
  render(
    <UserSessionProviders
      queryClient={queryClient}
      session={{ auth, countryId: 'us', pathname: ACCEPT_PAGE_PATH }}
    >
      <InvitationAcceptPage />
    </UserSessionProviders>
  );
  return { queryClient };
}

/** Puts the browser on the accept page, as the email's link (or a return to it) opens it. */
function openAcceptPage(fragment = '') {
  window.history.replaceState(null, '', `${ACCEPT_PAGE_PATH}${fragment}`);
}

function acceptRequests(): string[] {
  return sentRequests(fetchMock).filter((request) => request.includes('/invitations/accept'));
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

  test('given a signed-in invitee then /v2/me is read first and then only the token is posted', async () => {
    // Given
    savePendingInvitationToken(INVITATION_TOKEN);
    const { acceptBodies } = answerAcceptanceApi(fetchMock, { signedInUser: STANDARD_USER });

    // When
    renderAcceptPage();

    // Then
    expect(
      await screen.findByRole('heading', { name: 'You are now an author' })
    ).toBeInTheDocument();
    const requests = sentRequests(fetchMock);
    expect(requests[0]).toBe('GET /v2/me?country_id=us');
    expect(acceptRequests()).toEqual(['POST /v2/me/invitations/accept']);
    expect(acceptBodies).toEqual([{ token: INVITATION_TOKEN }]);
  });

  test('given the invitation is accepted then the token is dropped and /v2/me holds the new type', async () => {
    // Given
    savePendingInvitationToken(INVITATION_TOKEN);
    answerAcceptanceApi(fetchMock, { signedInUser: STANDARD_USER });

    // When
    const { queryClient } = renderAcceptPage();
    await screen.findByRole('heading', { name: 'You are now an author' });

    // Then
    expect(readPendingInvitationToken()).toBeNull();
    expect(queryClient.getQueryData(meQueryKey(TEST_AUTH0_SUBJECT, 'us'))).toMatchObject({
      user_type: 'author',
      latest_type_change: latestTypeChange(),
    });
  });

  test('given the user already had the type or a higher one then the page says nothing changed', async () => {
    // Given
    savePendingInvitationToken(INVITATION_TOKEN);
    const admin = meItemOfType('admin');
    answerAcceptanceApi(fetchMock, {
      signedInUser: admin,
      acceptResponse: () => okResponse({ item: admin, outcome: 'unchanged' }),
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

  test('given the email is not verified then returning to the page accepts the invitation', async () => {
    // Given
    savePendingInvitationToken(INVITATION_TOKEN);
    let verified = false;
    answerAcceptanceApi(fetchMock, {
      signedInUser: STANDARD_USER,
      acceptResponse: () =>
        verified
          ? okResponse({
              item: {
                ...STANDARD_USER,
                user_type: 'author',
                latest_type_change: latestTypeChange(),
              },
              outcome: 'changed',
            })
          : emailNotVerifiedResponse(),
    });
    renderAcceptPage();
    await screen.findByRole('heading', { name: 'Verify your email address' });

    // When
    verified = true;
    await returnToWindow();

    // Then
    expect(
      await screen.findByRole('heading', { name: 'You are now an author' })
    ).toBeInTheDocument();
    expect(acceptRequests()).toHaveLength(2);
  });

  test('given the signed-in address is not the invited one then the page says so and keeps the token', async () => {
    // Given
    savePendingInvitationToken(INVITATION_TOKEN);
    const auth = signedInAuthValue();
    answerAcceptanceApi(fetchMock, {
      signedInUser: STANDARD_USER,
      acceptResponse: () => errorResponse(403, INVITATION_API_MESSAGES.EMAIL_MISMATCH),
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
    [410, INVITATION_API_MESSAGES.INVITATION_GONE, 'This invitation link no longer works'],
    [422, 'The request does not match the schema.', 'This invitation link no longer works'],
    [409, INVITATION_API_MESSAGES.INVITER_NOT_ADMIN, 'This invitation is no longer valid'],
  ])(
    'given the acceptance is refused with %s then the page says so and drops the token',
    async (status, message, heading) => {
      // Given
      savePendingInvitationToken(INVITATION_TOKEN);
      answerAcceptanceApi(fetchMock, {
        signedInUser: STANDARD_USER,
        acceptResponse: () => errorResponse(status, message),
      });

      // When
      renderAcceptPage();

      // Then
      expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();
      expect(readPendingInvitationToken()).toBeNull();
    }
  );

  test('given Auth0 cannot be reached once then the acceptance is tried again by itself', async () => {
    // Given
    savePendingInvitationToken(INVITATION_TOKEN);
    let failures = 1;
    answerAcceptanceApi(fetchMock, {
      signedInUser: STANDARD_USER,
      acceptResponse: () => {
        if (failures > 0) {
          failures -= 1;
          return errorResponse(503, INVITATION_API_MESSAGES.AUTH0_UNAVAILABLE);
        }
        return okResponse({
          item: { ...STANDARD_USER, user_type: 'author', latest_type_change: latestTypeChange() },
          outcome: 'changed',
        });
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
          ? okResponse({
              item: {
                ...STANDARD_USER,
                user_type: 'author',
                latest_type_change: latestTypeChange(),
              },
              outcome: 'changed',
            })
          : errorResponse(503, INVITATION_API_MESSAGES.AUTH0_UNAVAILABLE),
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

  test('given /v2/me cannot be read then nothing is posted and trying again continues', async () => {
    // Given
    savePendingInvitationToken(INVITATION_TOKEN);
    let meAvailable = false;
    answerAcceptanceApi(fetchMock, { signedInUser: STANDARD_USER });
    const answerAsBefore = fetchMock.getMockImplementation()!;
    fetchMock.mockImplementation(async (url: string, init: RequestInit) =>
      !meAvailable && publicApiPathOf(url) === '/v2/me'
        ? errorResponse(500, 'The operation could not be completed.')
        : answerAsBefore(url, init)
    );
    renderAcceptPage();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We could not load your PolicyEngine account: The operation could not be completed.'
    );
    await letPendingWorkRun();
    expect(acceptRequests()).toEqual([]);

    // When
    meAvailable = true;
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }));

    // Then
    expect(
      await screen.findByRole('heading', { name: 'You are now an author' })
    ).toBeInTheDocument();
  });

  test('given the page renders again while the acceptance is under way then it is posted once', async () => {
    // Given
    savePendingInvitationToken(INVITATION_TOKEN);
    answerAcceptanceApi(fetchMock, { signedInUser: STANDARD_USER });

    // When
    renderAcceptPage();
    await returnToWindow();
    await screen.findByRole('heading', { name: 'You are now an author' });
    await returnToWindow();
    await letPendingWorkRun();

    // Then
    await waitFor(() => expect(acceptRequests()).toHaveLength(1));
  });
});
