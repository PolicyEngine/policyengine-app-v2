import { act, waitFor } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useMe } from '@/hooks/useMe';
import { useUserType } from '@/hooks/useUserType';
import type { AuthContextValue } from '@/libs/auth/AuthContext';
import {
  answerMe,
  answerMeWithUser,
  deferredResponse,
  errorResponse,
  meItemOfType,
  meItemWithUnknownType,
} from '@/tests/fixtures/api/v2UserMocks';
import { renderHookInSession } from '@/tests/fixtures/hooks/useMeMocks';
import { makeAuthValue, signedInAuthValue } from '@/tests/fixtures/libs/auth/authMocks';
import { accountStorage } from '@/tests/fixtures/types/v2UserMocks';

vi.mock('@/types/v2User', async (importOriginal) => {
  const { withSwitchableAccountStorage } = await import('@/tests/fixtures/types/v2UserMocks');
  return withSwitchableAccountStorage(await importOriginal());
});

const fetchMock = vi.fn();

/** Renders the user type beside the `/v2/me` query it reads, so a test can wait for the request. */
function renderUserType(auth: AuthContextValue) {
  return renderHookInSession(() => ({ userType: useUserType(), me: useMe() }), {
    auth,
    countryId: 'us',
  });
}

/** Lets queued promises and timers run, so a request the hook would send has been sent. */
async function letPendingWorkRun() {
  await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  accountStorage.withoutAccountStorage = false;
  vi.unstubAllGlobals();
});

describe('useUserType', () => {
  test('given a signed-out visitor then the type is unauthenticated', () => {
    // When
    const { result } = renderUserType(makeAuthValue());

    // Then
    expect(result.current.userType).toBe('unauthenticated');
  });

  test('given a signed-out visitor then /v2/me is not requested', async () => {
    // Given
    answerMeWithUser(fetchMock, meItemOfType('admin'));

    // When
    renderUserType(makeAuthValue());
    await letPendingWorkRun();

    // Then
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('given sign-in is disabled then the type is unauthenticated and /v2/me is not requested', async () => {
    // Given
    answerMeWithUser(fetchMock, meItemOfType('admin'));

    // When
    const { result } = renderUserType(makeAuthValue({ status: 'disabled' }));
    await letPendingWorkRun();

    // Then
    expect(result.current.userType).toBe('unauthenticated');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('given a signed-in user in a country without accounts then the type is unauthenticated and /v2/me is not requested', async () => {
    // Given
    accountStorage.withoutAccountStorage = true;
    answerMeWithUser(fetchMock, meItemOfType('admin'));

    // When
    const { result } = renderUserType(signedInAuthValue());
    await letPendingWorkRun();

    // Then
    expect(result.current.userType).toBe('unauthenticated');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('given a signed-in user while /v2/me loads then the type is unknown', async () => {
    // Given
    answerMe(fetchMock, { meResponse: () => deferredResponse().response });

    // When
    const { result } = renderUserType(signedInAuthValue());
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    // Then
    expect(result.current.userType).toBeNull();
  });

  test.each(['standard', 'author', 'admin'] as const)(
    'given /v2/me returns the %s type then useUserType returns that type',
    async (storedType) => {
      // Given
      answerMeWithUser(fetchMock, meItemOfType(storedType));

      // When
      const { result } = renderUserType(signedInAuthValue());

      // Then
      await waitFor(() => expect(result.current.userType).toBe(storedType));
    }
  );

  test('given /v2/me fails before it has answered then the type is unknown', async () => {
    // Given
    answerMe(fetchMock, {
      meResponse: () => errorResponse(500, 'The v2 database cannot be reached'),
    });

    // When
    const { result } = renderUserType(signedInAuthValue());
    await waitFor(() => expect(result.current.me.isError).toBe(true));

    // Then
    expect(result.current.userType).toBeNull();
  });

  test('given a refetch of /v2/me fails after it answered then the type is still the answered type', async () => {
    // Given
    answerMeWithUser(fetchMock, meItemOfType('author'));
    const { result } = renderUserType(signedInAuthValue());
    await waitFor(() => expect(result.current.userType).toBe('author'));
    answerMe(fetchMock, {
      meResponse: () => errorResponse(503, 'The v2 database cannot be reached'),
    });

    // When
    await act(() => result.current.me.refetch());
    await waitFor(() => expect(result.current.me.isError).toBe(true));

    // Then
    expect(result.current.userType).toBe('author');
  });

  test('given /v2/me returns a type the app does not know then the type is unauthenticated', async () => {
    // Given
    answerMeWithUser(fetchMock, meItemWithUnknownType);

    // When
    const { result } = renderUserType(signedInAuthValue());
    await waitFor(() => expect(result.current.me.isSuccess).toBe(true));

    // Then
    expect(result.current.userType).toBe('unauthenticated');
  });
});
