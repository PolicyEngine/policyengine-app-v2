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
  okResponse,
  PE_USER_ID,
  policyItem,
  reportItem,
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

/** The text of a downloaded file, read the way a browser would. */
function readBlob(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
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
    answerMe(fetchMock, {
      otherResponse: () =>
        okResponse({
          user: mockMeItem,
          policies: [],
          households: [],
          simulations: [],
          reports: [],
        }),
    });
    renderPage(signedInAuthValue());

    // When
    await user.click(await screen.findByRole('button', { name: /download my data/i }));

    // Then
    await waitFor(() => expect(createObjectURL).toHaveBeenCalled());
    const exportRequest = sentRequest('GET', '/api/policyengine/v2/me/export?country_id=us');
    expect(exportRequest.headers.Authorization).toBe(`Bearer ${TEST_ACCESS_TOKEN}`);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:export');
  });

  test('given "Download my data" then the file leaves out the account record and every user ID', async () => {
    // Given
    const user = userEvent.setup();
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:export');
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: vi.fn(),
    });
    const savedPolicy = policyItem();
    const savedReport = reportItem();
    answerMe(fetchMock, {
      otherResponse: () =>
        okResponse({
          user: mockMeItem,
          policies: [savedPolicy],
          households: [],
          simulations: [],
          reports: [savedReport],
        }),
    });
    renderPage(signedInAuthValue());

    // When
    await user.click(await screen.findByRole('button', { name: /download my data/i }));

    // Then
    await waitFor(() => expect(createObjectURL).toHaveBeenCalled());
    const fileText = await readBlob(createObjectURL.mock.calls[0][0] as Blob);
    const { user_id: _policyUserId, ...policyWithoutUser } = savedPolicy;
    const { user_id: _reportUserId, ...reportWithoutUser } = savedReport;
    expect(JSON.parse(fileText)).toEqual({
      policies: [policyWithoutUser],
      households: [],
      simulations: [],
      reports: [reportWithoutUser],
    });
    expect(fileText).not.toContain(PE_USER_ID);
    expect(fileText).not.toContain(mockMeItem.email);
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
