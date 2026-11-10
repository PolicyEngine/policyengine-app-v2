import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, renderHook, screen, waitFor } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { CountryProvider } from '@/contexts/CountryContext';
import { useMe } from '@/hooks/useMe';
import { useUserType } from '@/hooks/useUserType';
import type { AuthContextValue } from '@/libs/auth/AuthContext';
import type { CountryId } from '@/libs/countries';
import AccountPage from '@/pages/flagship/Account.page';
import {
  errorResponse,
  itemResponse,
  meItemOfType,
  meItemWithUnknownType,
} from '@/tests/fixtures/api/v2UserMocks';
import {
  AuthTestProvider,
  makeAuthValue,
  signedInAuthValue,
} from '@/tests/fixtures/libs/auth/authMocks';
import { accountStorage } from '@/tests/fixtures/types/v2UserMocks';
import type { MeItem } from '@/types/v2User';

vi.mock('@/types/v2User', async (importOriginal) => {
  const { withSwitchableAccountStorage } = await import('@/tests/fixtures/types/v2UserMocks');
  return withSwitchableAccountStorage(await importOriginal());
});

const fetchMock = vi.fn();

function createTestQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

/** Renders the user type beside the `/v2/me` query it reads, so a test can wait for the request. */
function renderUserType(auth: AuthContextValue, countryId: CountryId = 'us') {
  const queryClient = createTestQueryClient();
  return renderHook(() => ({ userType: useUserType(), me: useMe() }), {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <CountryProvider value={countryId}>
          <AuthTestProvider value={auth}>{children}</AuthTestProvider>
        </CountryProvider>
      </QueryClientProvider>
    ),
  });
}

/** Answers GET /v2/me with `meResponse`, and any other request with a 404. */
function answerMe(meResponse: () => Response | Promise<Response>) {
  fetchMock.mockImplementation(async (url: string, init: RequestInit) =>
    new URL(url).pathname === '/v2/me' && init.method === 'GET'
      ? meResponse()
      : errorResponse(404, 'Not found')
  );
}

function answerMeWithUser(meItem: MeItem) {
  answerMe(() => itemResponse(meItem));
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
    answerMeWithUser(meItemOfType('admin'));

    // When
    renderUserType(makeAuthValue());
    await letPendingWorkRun();

    // Then
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('given sign-in is disabled then the type is unauthenticated and /v2/me is not requested', async () => {
    // Given
    answerMeWithUser(meItemOfType('admin'));

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
    answerMeWithUser(meItemOfType('admin'));

    // When
    const { result } = renderUserType(signedInAuthValue());
    await letPendingWorkRun();

    // Then
    expect(result.current.userType).toBe('unauthenticated');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('given a signed-in user while /v2/me loads then the type is unauthenticated', async () => {
    // Given
    answerMe(() => new Promise<Response>(() => {}));

    // When
    const { result } = renderUserType(signedInAuthValue());
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    // Then
    expect(result.current.userType).toBe('unauthenticated');
  });

  test.each(['standard', 'author', 'admin'] as const)(
    'given /v2/me returns the %s type then the user type is %s',
    async (storedType) => {
      // Given
      answerMeWithUser(meItemOfType(storedType));

      // When
      const { result } = renderUserType(signedInAuthValue());

      // Then
      await waitFor(() => expect(result.current.userType).toBe(storedType));
    }
  );

  test('given /v2/me fails then the type is unauthenticated', async () => {
    // Given
    answerMe(() => errorResponse(500, 'The v2 database cannot be reached'));

    // When
    const { result } = renderUserType(signedInAuthValue());
    await waitFor(() => expect(result.current.me.isError).toBe(true));

    // Then
    expect(result.current.userType).toBe('unauthenticated');
  });

  test('given /v2/me returns a type the app does not know then the type is unauthenticated', async () => {
    // Given
    answerMeWithUser(meItemWithUnknownType);

    // When
    const { result } = renderUserType(signedInAuthValue());
    await waitFor(() => expect(result.current.me.isSuccess).toBe(true));

    // Then
    expect(result.current.userType).toBe('unauthenticated');
  });

  test('given the account page shows the user then the type comes from the same /v2/me request', async () => {
    // Given
    answerMeWithUser(meItemOfType('author'));
    function UserTypeProbe() {
      return <p>User type: {useUserType()}</p>;
    }

    // When
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <AuthTestProvider value={signedInAuthValue()}>
          <AccountPage />
          <UserTypeProbe />
        </AuthTestProvider>
      </QueryClientProvider>
    );

    // Then
    expect(await screen.findByText('User type: author')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
