import { render, screen, waitFor } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useMe } from '@/hooks/useMe';
import AccountPage from '@/pages/flagship/Account.page';
import {
  answerMe,
  answerMeWithUser,
  deferredResponse,
  meItemOfType,
  OTHER_ACCESS_TOKEN,
} from '@/tests/fixtures/api/v2UserMocks';
import {
  createTestQueryClient,
  letPendingWorkRun,
  renderHookInSession,
  UserSessionProviders,
} from '@/tests/fixtures/hooks/useMeMocks';
import { UserTypeProbe } from '@/tests/fixtures/hooks/useUserTypeMocks';
import { otherAccountAuthValue, signedInAuthValue } from '@/tests/fixtures/libs/auth/authMocks';

const fetchMock = vi.fn();

/** The `country_id` of the nth request sent (counting from 0). */
function requestedCountry(requestIndex: number): string | null {
  const [url] = fetchMock.mock.calls[requestIndex];
  return new URL(url).searchParams.get('country_id');
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  window.history.pushState(null, '', '/');
});

describe('useMe', () => {
  test('given the account page shows the user then the user type comes from the same /v2/me request', async () => {
    // Given
    answerMeWithUser(fetchMock, meItemOfType('author'));

    // When
    render(
      <UserSessionProviders
        queryClient={createTestQueryClient()}
        session={{ auth: signedInAuthValue(), countryId: 'us' }}
      >
        <AccountPage />
        <UserTypeProbe />
      </UserSessionProviders>
    );

    // Then
    expect(await screen.findByText('User type: author')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("given the country changes then /v2/me is requested for it and the last country's user is not used", async () => {
    // Given
    const auth = signedInAuthValue();
    answerMeWithUser(fetchMock, meItemOfType('author'));
    const { result, changeSession } = renderHookInSession(() => useMe(), {
      auth,
      countryId: 'us',
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const ukAnswer = deferredResponse();
    answerMe(fetchMock, { meResponse: () => ukAnswer.response });

    // When
    changeSession({ auth, countryId: 'uk' });

    // Then
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(requestedCountry(1)).toBe('uk');
    expect(result.current.data).toBeUndefined();
  });

  test("given another account signs in then /v2/me is requested for it and the last account's user is not used", async () => {
    // Given
    answerMeWithUser(fetchMock, meItemOfType('author'));
    const { result, changeSession } = renderHookInSession(() => useMe(), {
      auth: signedInAuthValue(),
      countryId: 'us',
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const otherAccountAnswer = deferredResponse();
    answerMe(fetchMock, { meResponse: () => otherAccountAnswer.response });

    // When
    changeSession({ auth: otherAccountAuthValue(), countryId: 'us' });

    // Then
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(result.current.data).toBeUndefined();
    const [, secondRequest] = fetchMock.mock.calls[1];
    expect(secondRequest.headers.Authorization).toBe(`Bearer ${OTHER_ACCESS_TOKEN}`);
  });

  test('given a signed-in user on the sign-in callback then /v2/me is not requested', async () => {
    // Given
    answerMeWithUser(fetchMock, meItemOfType('admin'));

    // When
    renderHookInSession(() => useMe(), {
      auth: signedInAuthValue(),
      countryId: 'us',
      pathname: '/us/callback',
    });
    await letPendingWorkRun();

    // Then
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('given a signed-in user on the sign-in callback with no location provider then /v2/me is not requested', async () => {
    // Given
    answerMeWithUser(fetchMock, meItemOfType('admin'));
    window.history.pushState(null, '', '/uk/callback');

    // When
    renderHookInSession(() => useMe(), { auth: signedInAuthValue(), countryId: 'uk' });
    await letPendingWorkRun();

    // Then
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
