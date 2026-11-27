import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { AuthContextValue } from '@/libs/auth/AuthContext';
import AccountDataPage from '@/pages/flagship/AccountData.page';
import {
  answerMe,
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

const EXPORT_URL = '/api/policyengine/v2/me/export?country_id=us';

/** The text of a downloaded file, read the way a browser would. */
function readBlob(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

/** Captures the file a download makes. jsdom has no revokeObjectURL, so it is stubbed. */
function captureDownloads() {
  const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:export');
  const revokeObjectURL = vi.fn();
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    writable: true,
    value: revokeObjectURL,
  });
  return { createObjectURL, revokeObjectURL };
}

function answerExport(exported: unknown) {
  answerMe(fetchMock, { otherResponse: () => okResponse(exported) });
}

function renderPage(auth: AuthContextValue, countryId = 'us') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthTestProvider value={auth}>
        <AccountDataPage />
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

describe('AccountDataPage', () => {
  test('given a signed-in user then the My data page has only the download', () => {
    // When
    renderPage(signedInAuthValue());

    // Then
    expect(screen.getByRole('heading', { level: 1, name: 'My data' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /download my data/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete my account/i })).not.toBeInTheDocument();
    expect(screen.queryByText('Member since')).not.toBeInTheDocument();
  });

  test('given "Download my data" then the export is fetched with the session token', async () => {
    // Given
    const user = userEvent.setup();
    const { createObjectURL, revokeObjectURL } = captureDownloads();
    answerExport({ user: mockMeItem, policies: [], households: [], simulations: [], reports: [] });
    renderPage(signedInAuthValue());

    // When
    await user.click(screen.getByRole('button', { name: /download my data/i }));

    // Then
    await waitFor(() => expect(createObjectURL).toHaveBeenCalled());
    const exportRequests = fetchMock.mock.calls.filter(([url]) => url === EXPORT_URL);
    expect(exportRequests).toHaveLength(1);
    expect(exportRequests[0][1].headers.Authorization).toBe(`Bearer ${TEST_ACCESS_TOKEN}`);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:export');
  });

  test('given "Download my data" then the file leaves out the account record and every user ID', async () => {
    // Given
    const user = userEvent.setup();
    const { createObjectURL } = captureDownloads();
    const savedPolicy = policyItem();
    const savedReport = reportItem();
    answerExport({
      user: mockMeItem,
      policies: [savedPolicy],
      households: [],
      simulations: [],
      reports: [savedReport],
    });
    renderPage(signedInAuthValue());

    // When
    await user.click(screen.getByRole('button', { name: /download my data/i }));

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

  test('given a signed-out visitor then the My data page offers sign-in and no download', async () => {
    // Given
    const user = userEvent.setup();
    const auth = makeAuthValue();
    renderPage(auth);

    // When
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    // Then
    expect(auth.signIn).toHaveBeenCalled();
    expect(screen.getByRole('heading', { level: 1, name: 'My data' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /download my data/i })).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('given a country without account storage then the My data page points to the US and UK', () => {
    // Given
    accountStorage.withoutAccountStorage = true;

    // When
    renderPage(signedInAuthValue());

    // Then
    expect(
      screen.getByText(/accounts store work for the us and uk calculators/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /download my data/i })).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
