import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { AuthContextValue } from '@/libs/auth/AuthContext';
import AccountPage from '@/pages/flagship/Account.page';
import {
  errorResponse,
  itemResponse,
  mockMeItem,
  noContentResponse,
  okResponse,
  TEST_ACCESS_TOKEN,
} from '@/tests/fixtures/api/v2UserMocks';
import {
  AuthTestProvider,
  makeAuthValue,
  signedInAuthValue,
} from '@/tests/fixtures/libs/auth/authMocks';

const fetchMock = vi.fn();

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

/** Answers GET /v2/me with the user, and everything else with `other`. */
function answerMe(other: () => Response = () => noContentResponse()) {
  fetchMock.mockImplementation(async (url: string, init: RequestInit) =>
    new URL(url).pathname === '/v2/me' && init.method === 'GET' ? itemResponse(mockMeItem) : other()
  );
}

beforeEach(() => {
  localStorage.clear();
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

  test('given a signed-in user then the page loads their PolicyEngine user from /v2/me', async () => {
    // Given
    answerMe();

    // When
    renderPage(signedInAuthValue());

    // Then
    expect(await screen.findByText(mockMeItem.id)).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.policyengine.org/v2/me?country_id=us');
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
    answerMe();
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    // Then
    expect(await screen.findByText(mockMeItem.id)).toBeInTheDocument();
  });

  test('given "Download my data" then the export is fetched with the session token', async () => {
    // Given
    const user = userEvent.setup();
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:export');
    // jsdom has no revokeObjectURL
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: revokeObjectURL,
    });
    answerMe(() =>
      okResponse({ user: mockMeItem, policies: [], households: [], simulations: [], reports: [] })
    );
    renderPage(signedInAuthValue());

    // When
    await user.click(await screen.findByRole('button', { name: /download my data/i }));

    // Then
    await waitFor(() => expect(createObjectURL).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe('https://api.policyengine.org/v2/me/export?country_id=us');
    expect(init.headers.Authorization).toBe(`Bearer ${TEST_ACCESS_TOKEN}`);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:export');
  });

  test('given a confirmed deletion then the account is deleted and the user signed out', async () => {
    // Given
    const user = userEvent.setup();
    const auth = signedInAuthValue();
    answerMe();
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
    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe('https://api.policyengine.org/v2/me?country_id=us');
    expect(init.method).toBe('DELETE');
  });

  test('given a country without account storage then the page points to the US and UK', () => {
    renderPage(signedInAuthValue(), 'ca');

    expect(
      screen.getByText(/accounts store work for the us and uk calculators/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete my account/i })).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test.each(['ca', 'ng', 'il'])(
    'given a signed-out visitor in %s then the page points to the US and UK, with no sign-in',
    (countryId) => {
      renderPage(makeAuthValue(), countryId);

      expect(
        screen.getByText(/accounts store work for the us and uk calculators/i)
      ).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /sign out/i })).not.toBeInTheDocument();
    }
  );
});
