import { act, cleanup, render, screen, userEvent, waitFor } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createV2UserClient } from '@/api/v2UserClient';
import UserTypeChangeBanner from '@/components/auth/UserTypeChangeBanner';
import { dismissAccountUpgradeNotice, runAccountUpgrade } from '@/libs/auth/accountUpgrade';
import type { AuthContextValue } from '@/libs/auth/AuthContext';
import { publicApiPathOf } from '@/tests/fixtures/api/publicApiRouteMocks';
import { sentRequests } from '@/tests/fixtures/api/v2AdminUserMocks';
import { latestTypeChange, meResponse } from '@/tests/fixtures/api/v2InvitationMocks';
import {
  errorResponse,
  itemResponse,
  mockMeItem,
  noContentResponse,
  okResponse,
  TEST_ACCESS_TOKEN,
  TEST_API_BASE,
} from '@/tests/fixtures/api/v2UserMocks';
import {
  createTestQueryClient,
  letPendingWorkRun,
  UserSessionProviders,
} from '@/tests/fixtures/hooks/useMeMocks';
import { makeAuthValue, signedInAuthValue } from '@/tests/fixtures/libs/auth/authMocks';
import type { LatestUserTypeChange, MeItem } from '@/types/v2User';

const fetchMock = vi.fn();
const PROMOTION = latestTypeChange();
/** Marks a `/v2/me` answer without `latest_type_change`, as from an API that does not send it. */
const NOT_SENT = 'not sent' as const;
const PROMOTED_USER: MeItem = { ...mockMeItem, user_type: 'author' };

function renderBanner(auth: AuthContextValue = signedInAuthValue()) {
  return render(
    <UserSessionProviders
      queryClient={createTestQueryClient()}
      session={{ auth, countryId: 'us', pathname: '/us/reports' }}
    >
      <UserTypeChangeBanner />
    </UserSessionProviders>
  );
}

/**
 * Answers `GET /v2/me` with `signedInUser` and, beside it, `latestChange`,
 * which a dismissal clears as the API does; the dismissal answers with
 * `dismissResponse` (by default 204). `NOT_SENT` answers as an API that
 * does not send a latest type change.
 */
function answerMeAndDismissal(
  signedInUser: MeItem,
  latestChange: LatestUserTypeChange | null | typeof NOT_SENT = PROMOTION,
  dismissResponse: () => Response = () => noContentResponse()
) {
  const state = { latestChange };
  fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
    const path = publicApiPathOf(url);
    if (path === '/v2/me' && init.method === 'GET') {
      return state.latestChange === NOT_SENT
        ? itemResponse(signedInUser)
        : meResponse(signedInUser, state.latestChange);
    }
    if (path === `/v2/me/type-changes/${PROMOTION.id}/dismiss` && init.method === 'POST') {
      const response = dismissResponse();
      if (response.ok) {
        state.latestChange = null;
      }
      return response;
    }
    return errorResponse(404, 'Not found');
  });
  return state;
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  cleanup();
  act(() => dismissAccountUpgradeNotice());
  vi.unstubAllGlobals();
});

describe('UserTypeChangeBanner', () => {
  test("given /v2/me names the user's latest type change then the banner says from what to what, and when", async () => {
    // Given
    answerMeAndDismissal(PROMOTED_USER);

    // When
    renderBanner();

    // Then
    const banner = await screen.findByRole('region', { name: 'Your account type changed' });
    expect(banner).toHaveTextContent('It changed from Standard to Author on Oct 12, 2026.');
  });

  test.each([
    ['null', null],
    ['absent', NOT_SENT],
  ])('given the latest type change is %s then no banner shows', async (_label, latestChange) => {
    // Given
    answerMeAndDismissal(mockMeItem, latestChange);

    // When
    renderBanner();
    await waitFor(() => expect(sentRequests(fetchMock)).toContain('GET /v2/me?country_id=us'));
    await letPendingWorkRun();

    // Then
    expect(
      screen.queryByRole('region', { name: 'Your account type changed' })
    ).not.toBeInTheDocument();
  });

  test('given a signed-out visitor then nothing is requested and no banner shows', async () => {
    // When
    renderBanner(makeAuthValue());
    await letPendingWorkRun();

    // Then
    expect(fetchMock).not.toHaveBeenCalled();
    expect(
      screen.queryByRole('region', { name: 'Your account type changed' })
    ).not.toBeInTheDocument();
  });

  test('given the user dismisses the banner then the dismissal is posted for that change and the banner goes', async () => {
    // Given
    answerMeAndDismissal(PROMOTED_USER);
    renderBanner();
    await screen.findByRole('region', { name: 'Your account type changed' });

    // When
    await userEvent.setup().click(screen.getByRole('button', { name: 'Dismiss' }));

    // Then
    await waitFor(() =>
      expect(
        screen.queryByRole('region', { name: 'Your account type changed' })
      ).not.toBeInTheDocument()
    );
    expect(sentRequests(fetchMock)).toContain(
      `POST /v2/me/type-changes/${PROMOTION.id}/dismiss?country_id=us`
    );
  });

  test('given the dismissal fails then the banner stays and says why', async () => {
    // Given
    answerMeAndDismissal(PROMOTED_USER, PROMOTION, () =>
      errorResponse(500, 'The operation could not be completed.')
    );
    renderBanner();
    await screen.findByRole('region', { name: 'Your account type changed' });

    // When
    await userEvent.setup().click(screen.getByRole('button', { name: 'Dismiss' }));

    // Then
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We could not dismiss this: The operation could not be completed.'
    );
    expect(screen.getByRole('region', { name: 'Your account type changed' })).toBeInTheDocument();
  });

  test('given the change was already dismissed elsewhere then /v2/me is read again and the banner goes', async () => {
    // Given
    const apiState = answerMeAndDismissal(PROMOTED_USER, PROMOTION, () =>
      errorResponse(404, 'The caller has no type change with this ID.')
    );
    renderBanner();
    await screen.findByRole('region', { name: 'Your account type changed' });
    apiState.latestChange = null;

    // When
    await userEvent.setup().click(screen.getByRole('button', { name: 'Dismiss' }));

    // Then
    await waitFor(() =>
      expect(
        screen.queryByRole('region', { name: 'Your account type changed' })
      ).not.toBeInTheDocument()
    );
    expect(
      sentRequests(fetchMock).filter((request) => request.startsWith('GET /v2/me'))
    ).toHaveLength(2);
  });

  test("given the sign-in upgrade's notice is showing then the banner waits until it is dismissed", async () => {
    // Given
    answerMeAndDismissal(PROMOTED_USER);
    const upgradeClient = createV2UserClient({
      credentials: { kind: 'session', getAccessToken: async () => TEST_ACCESS_TOKEN },
      baseUrl: TEST_API_BASE,
      fetchImpl: (async () =>
        okResponse({ item: mockMeItem, outcome: 'merged' })) as unknown as typeof fetch,
    });
    await act(() => runAccountUpgrade({ client: upgradeClient, countryId: 'us' }));
    renderBanner();
    await waitFor(() => expect(sentRequests(fetchMock)).toContain('GET /v2/me?country_id=us'));
    await letPendingWorkRun();
    expect(
      screen.queryByRole('region', { name: 'Your account type changed' })
    ).not.toBeInTheDocument();

    // When
    act(() => dismissAccountUpgradeNotice());

    // Then
    expect(
      await screen.findByRole('region', { name: 'Your account type changed' })
    ).toBeInTheDocument();
  });
});
