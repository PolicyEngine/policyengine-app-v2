import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { AuthContextValue } from '@/libs/auth/AuthContext';
import AccountPage from '@/pages/Account.page';
import {
  mockMeItem,
  noContentResponse,
  okResponse,
  TEST_ACCESS_TOKEN,
} from '@/tests/fixtures/api/v2UserMocks';
import {
  accountErrorAuthValue,
  AuthTestProvider,
  makeAuthValue,
  signedInAuthValue,
} from '@/tests/fixtures/libs/auth/authMocks';

const fetchMock = vi.fn();

function renderPage(auth: AuthContextValue, countryId = 'us') {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <AuthTestProvider value={auth}>
        <AccountPage />
      </AuthTestProvider>
    </QueryClientProvider>,
    countryId
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
    const auth = makeAuthValue({ status: 'anonymous' });
    renderPage(auth);

    // When
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    // Then
    expect(auth.signIn).toHaveBeenCalled();
  });

  test('given a signed-in user then their account details are shown', () => {
    renderPage(signedInAuthValue());

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText(mockMeItem.email!)).toBeInTheDocument();
    expect(screen.getByText(mockMeItem.id)).toBeInTheDocument();
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
    fetchMock.mockResolvedValue(
      okResponse({ user: mockMeItem, policies: [], households: [], simulations: [], reports: [] })
    );
    renderPage(signedInAuthValue());

    // When
    await user.click(screen.getByRole('button', { name: /download my data/i }));

    // Then
    await waitFor(() => expect(createObjectURL).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.policyengine.org/v2/me/export?country_id=us');
    expect(init.headers.Authorization).toBe(`Bearer ${TEST_ACCESS_TOKEN}`);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:export');
  });

  test('given a confirmed deletion then the account is deleted and the user signed out', async () => {
    // Given
    const user = userEvent.setup();
    const auth = signedInAuthValue();
    fetchMock.mockResolvedValue(noContentResponse());
    renderPage(auth);

    // When
    await user.click(screen.getByRole('button', { name: /delete my account/i }));
    const confirm = await screen.findByRole('dialog');
    await user.click(
      Array.from(confirm.querySelectorAll('button')).find(
        (button) => button.textContent === 'Delete my account'
      )!
    );

    // Then
    await waitFor(() => expect(auth.signOut).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.policyengine.org/v2/me?country_id=us');
    expect(init.method).toBe('DELETE');
  });

  test('given a country without account storage then the page points to the US and UK', () => {
    renderPage(signedInAuthValue(), 'ca');

    expect(
      screen.getByText(/accounts store work for the us and uk calculators/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete my account/i })).not.toBeInTheDocument();
  });

  test('given the account could not be loaded then the page offers Try again and Sign out', async () => {
    // Given
    const user = userEvent.setup();
    const auth = accountErrorAuthValue();
    renderPage(auth);

    // When
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    // Then
    expect(screen.getByRole('alert')).toHaveTextContent(
      /could not load your PolicyEngine account: Saved work is temporarily unavailable/
    );
    expect(auth.retryAccount).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
  });
});
