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
import { letPendingWorkRun, renderHookInSession } from '@/tests/fixtures/hooks/useMeMocks';
import { makeAuthValue, signedInAuthValue } from '@/tests/fixtures/libs/auth/authMocks';
import { accountStorage } from '@/tests/fixtures/types/v2UserMocks';

vi.mock('@/types/v2User', async (importOriginal) => {
  const { withSwitchableAccountStorage } = await import('@/tests/fixtures/types/v2UserMocks');
  return withSwitchableAccountStorage(await importOriginal());
});

const fetchMock = vi.fn();

/**
 * Renders the user type beside the status of the `/v2/me` query it reads, so
 * a test can wait for the request. The status is read while rendering:
 * react-query re-renders only for the result fields a render read.
 */
function renderUserType(auth: AuthContextValue, pathname?: string) {
  return renderHookInSession(
    () => {
      const me = useMe();
      return { userType: useUserType(), meStatus: me.status, refetchMe: me.refetch };
    },
    { auth, countryId: 'us', pathname }
  );
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
    await waitFor(() => expect(result.current.meStatus).toBe('error'));

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
    await act(() => result.current.refetchMe());
    await waitFor(() => expect(result.current.meStatus).toBe('error'));

    // Then
    expect(result.current.userType).toBe('author');
  });

  test('given /v2/me returns a type the app does not know then the type is standard', async () => {
    // Given
    answerMeWithUser(fetchMock, meItemWithUnknownType);

    // When
    const { result } = renderUserType(signedInAuthValue());
    await waitFor(() => expect(result.current.meStatus).toBe('success'));

    // Then
    expect(result.current.userType).toBe('standard');
  });

  test('given a signed-in admin on the sign-in callback then the type is unknown and /v2/me is not requested', async () => {
    // Given
    answerMeWithUser(fetchMock, meItemOfType('admin'));

    // When
    const { result } = renderUserType(signedInAuthValue(), '/us/callback');
    await letPendingWorkRun();

    // Then
    expect(result.current.userType).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('given an admin whose session ends on the page then the type is unauthenticated', async () => {
    // Given
    answerMeWithUser(fetchMock, meItemOfType('admin'));
    const { result, changeSession } = renderUserType(signedInAuthValue());
    await waitFor(() => expect(result.current.userType).toBe('admin'));

    // When
    changeSession({ auth: makeAuthValue({ sessionEnded: true }), countryId: 'us' });

    // Then
    expect(result.current.userType).toBe('unauthenticated');
  });
});
