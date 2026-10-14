import { render, screen, userEvent, waitFor } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { UNAUTHENTICATED_USER_HEADER } from '@/api/v2UserClient';
import AccountUpgradeNotice from '@/components/auth/AccountUpgradeNotice';
import { NavigationProvider } from '@/contexts/NavigationContext';
import {
  dismissAccountUpgradeNotice,
  UPGRADE_FAILURE_MESSAGE,
  UPGRADE_SUCCESS_MESSAGE,
} from '@/libs/auth/accountUpgrade';
import type { AuthContextValue } from '@/libs/auth/AuthContext';
import { takeSignInReturnTo } from '@/libs/auth/AuthProvider';
import { getBrowserUserId } from '@/libs/auth/browserUser';
import AuthCallbackPage from '@/pages/flagship/AuthCallback.page';
import { errorResponse, mockMeItem, okResponse } from '@/tests/fixtures/api/v2UserMocks';
import {
  AuthTestProvider,
  makeAuthValue,
  signedInAuthValue,
} from '@/tests/fixtures/libs/auth/authMocks';
import type { UpgradeOutcome } from '@/types/v2User';

vi.mock('@/libs/auth/AuthProvider', () => ({
  takeSignInReturnTo: vi.fn(),
}));

const fetchMock = vi.fn();
const navigation = { push: vi.fn(), replace: vi.fn(), back: vi.fn() };

function renderCallback(auth: AuthContextValue) {
  return render(
    <NavigationProvider value={navigation}>
      <AuthTestProvider value={auth}>
        <AuthCallbackPage />
        <AccountUpgradeNotice />
      </AuthTestProvider>
    </NavigationProvider>
  );
}

/** Answers the upgrade with `outcome`, or with a failure. */
function answerUpgrade(answer: UpgradeOutcome | 'fail') {
  fetchMock.mockImplementation(async (url: string) => {
    if (new URL(url).pathname !== '/v2/me/upgrade') {
      return new Response('', { status: 404 });
    }
    return answer === 'fail'
      ? errorResponse(503, 'Saved work is temporarily unavailable.')
      : okResponse({ item: mockMeItem, outcome: answer });
  });
}

function upgradeRequest(index = 0) {
  const [url, init] = fetchMock.mock.calls[index] as [string, RequestInit];
  return { url: new URL(url), headers: init.headers as Record<string, string> };
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
  vi.mocked(takeSignInReturnTo).mockReturnValue('/us/reforms');
  dismissAccountUpgradeNotice();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AuthCallbackPage', () => {
  test("given this browser's user had saved work then it is upgraded into the account, then it returns", async () => {
    // Given
    const browserUserId = getBrowserUserId();
    answerUpgrade('converted');

    // When
    renderCallback(signedInAuthValue());

    // Then
    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('/us/reforms'));
    const request = upgradeRequest();
    expect(request.url.searchParams.get('country_id')).toBe('us');
    expect(request.headers[UNAUTHENTICATED_USER_HEADER]).toBe(browserUserId);
    expect(request.headers.Authorization).toMatch(/^Bearer /);
    expect(await screen.findByRole('alert')).toHaveTextContent(UPGRADE_SUCCESS_MESSAGE);
    // The browser starts over, so whoever is next here signed out starts empty.
    expect(getBrowserUserId()).not.toBe(browserUserId);
  });

  test('given nothing to upgrade then it returns without a notice', async () => {
    // Given
    answerUpgrade('none');

    // When
    renderCallback(signedInAuthValue());

    // Then
    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('/us/reforms'));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('given the upgrade fails then the browser keeps its user, and Try again upgrades it', async () => {
    // Given
    const browserUserId = getBrowserUserId();
    answerUpgrade('fail');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();
    renderCallback(signedInAuthValue());
    expect(await screen.findByRole('alert')).toHaveTextContent(UPGRADE_FAILURE_MESSAGE);
    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('/us/reforms'));
    expect(getBrowserUserId()).toBe(browserUserId);

    // When
    answerUpgrade('merged');
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    // Then
    expect(await screen.findByText(UPGRADE_SUCCESS_MESSAGE)).toBeInTheDocument();
    expect(upgradeRequest(1).headers[UNAUTHENTICATED_USER_HEADER]).toBe(browserUserId);
    expect(getBrowserUserId()).not.toBe(browserUserId);
  });

  test('given sign-in did not complete then the error shows and nothing is called', () => {
    // When
    renderCallback(makeAuthValue({ error: new Error('access_denied') }));

    // Then
    expect(screen.getByText('Sign-in did not complete')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(navigation.replace).not.toHaveBeenCalled();
  });
});
