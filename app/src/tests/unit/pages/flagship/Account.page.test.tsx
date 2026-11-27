import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { AuthContextValue } from '@/libs/auth/AuthContext';
import AccountPage from '@/pages/flagship/Account.page';
import {
  answerMe,
  errorResponse,
  itemResponse,
  meItemOfType,
  mockMeItem,
  TEST_ACCESS_TOKEN,
} from '@/tests/fixtures/api/v2UserMocks';
import {
  AuthTestProvider,
  makeAuthValue,
  signedInAuthValue,
} from '@/tests/fixtures/libs/auth/authMocks';
import { accountStorage } from '@/tests/fixtures/types/v2UserMocks';

vi.mock('@/types/v2User', async (importOriginal) => {
  const { withSwitchableAccountStorage } = await import('@/tests/fixtures/types/v2UserMocks');
  return withSwitchableAccountStorage(await importOriginal());
});

const fetchMock = vi.fn();

interface SentRequest {
  method?: string;
  headers: Record<string, string>;
}

/**
 * The one request the page sent to `url` with `method`, so a test checks
 * that request whatever else the page read, such as `GET /v2/me` again.
 */
function sentRequest(method: string, url: string): SentRequest {
  const matching = fetchMock.mock.calls.filter(
    ([sentUrl, init]) => sentUrl === url && (init?.method ?? 'GET').toUpperCase() === method
  );
  expect(matching).toHaveLength(1);
  return matching[0][1];
}

function renderPage(auth: AuthContextValue, countryId = 'us') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthTestProvider value={auth}>
        <AccountPage />
      </AuthTestProvider>
    </QueryClientProvider>,
    countryId
  );
}

beforeEach(() => {
  localStorage.clear();
  accountStorage.withoutAccountStorage = false;
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

describe('AccountPage', () => {
  test('given sign-in is disabled then the page says so', () => {
    renderPage(makeAuthValue({ status: 'disabled' }));

    expect(screen.getByText('Signing in is not available here yet.')).toBeInTheDocument();
  });

  test('given a signed-out visitor then the page offers sign-in', async () => {
    // Given
    const user = userEvent.setup();
    const auth = makeAuthValue();
    renderPage(auth);

    // When
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    // Then
    expect(auth.signIn).toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('given a signed-in user then the General page loads their PolicyEngine user from /v2/me, without showing its ID', async () => {
    // Given
    answerMe(fetchMock);

    // When
    renderPage(signedInAuthValue());

    // Then
    expect(await screen.findByText('Member since')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'General' })).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.queryByText(mockMeItem.id)).not.toBeInTheDocument();
    expect(screen.queryByText('PolicyEngine user ID')).not.toBeInTheDocument();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/policyengine/v2/me?country_id=us');
    expect(init.headers.Authorization).toBe(`Bearer ${TEST_ACCESS_TOKEN}`);
  });

  test('given /v2/me fails then the error shows with Try again, and nothing falls back', async () => {
    // Given
    fetchMock.mockResolvedValueOnce(errorResponse(503, 'Saved work is temporarily unavailable.'));
    const user = userEvent.setup();
    renderPage(signedInAuthValue());
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /could not load your PolicyEngine account: Saved work is temporarily unavailable/
    );

    // When
    answerMe(fetchMock);
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    // Then
    expect(await screen.findByText('Member since')).toBeInTheDocument();
  });

  test('given a signed-in user then the General page has no "Download my data": it is on My data', async () => {
    // Given
    answerMe(fetchMock);

    // When
    renderPage(signedInAuthValue());
    await screen.findByText('Member since');

    // Then
    expect(screen.queryByRole('button', { name: /download my data/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete my account/i })).toBeInTheDocument();
  });

  test('given a confirmed deletion then the account is deleted and the user signed out', async () => {
    // Given
    const user = userEvent.setup();
    const auth = signedInAuthValue();
    answerMe(fetchMock);
    renderPage(auth);

    // When
    await user.click(await screen.findByRole('button', { name: /delete my account/i }));
    const confirm = await screen.findByRole('dialog');
    await user.click(
      Array.from(confirm.querySelectorAll('button')).find(
        (button) => button.textContent === 'Delete my account'
      )!
    );

    // Then
    await waitFor(() => expect(auth.signOut).toHaveBeenCalled());
    const deletion = sentRequest('DELETE', '/api/policyengine/v2/me?country_id=us');
    expect(deletion.headers.Authorization).toBe(`Bearer ${TEST_ACCESS_TOKEN}`);
  });

  test('given an admin then the page has no users section: the account menu leads there', async () => {
    // Given
    answerMe(fetchMock, { meResponse: () => itemResponse(meItemOfType('admin')) });

    // When
    renderPage(signedInAuthValue());
    await screen.findByText('Member since');

    // Then
    expect(screen.queryByRole('link', { name: 'Manage users' })).not.toBeInTheDocument();
    expect(screen.queryByText(/find signed-in users/i)).not.toBeInTheDocument();
  });

  test('given a country without account storage then the page points to the US and UK', () => {
    accountStorage.withoutAccountStorage = true;

    renderPage(signedInAuthValue());

    expect(
      screen.getByText(/accounts store work for the us and uk calculators/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete my account/i })).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('given a signed-out visitor in a country without account storage then there is no sign-in', () => {
    accountStorage.withoutAccountStorage = true;

    renderPage(makeAuthValue());

    expect(
      screen.getByText(/accounts store work for the us and uk calculators/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /sign out/i })).not.toBeInTheDocument();
  });
});
