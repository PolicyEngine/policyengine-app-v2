import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { FlagshipReportData } from '@/hooks/useFlagshipReport';
import type { AuthContextValue } from '@/libs/auth/AuthContext';
import FlagshipReportPage from '@/pages/flagship/Report.page';
import { clearMetadata } from '@/reducers/metadataReducer';
import { store } from '@/store';
import {
  ASSOCIATION_IDS,
  errorResponse,
  itemResponse,
  LEGACY_IDS,
  sharedReportItem,
} from '@/tests/fixtures/api/v2UserMocks';
import {
  EXISTING_REPORT,
  EXISTING_SIMULATIONS,
} from '@/tests/fixtures/hooks/useFlagshipReportMocks';
import { AuthTestProvider, makeAuthValue } from '@/tests/fixtures/libs/auth/authMocks';

const mockUseFlagshipReport = vi.fn();
const mockCalcStatus = vi.fn();
const fetchMock = vi.fn();

// The real isApiReportId: which links open is what these tests are about.
vi.mock('@/hooks/useFlagshipReport', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/hooks/useFlagshipReport')>()),
  useFlagshipReport: (apiReportId: string) => mockUseFlagshipReport(apiReportId),
}));

vi.mock('@/hooks/useCalculationStatus', () => ({
  useCalculationStatus: () => mockCalcStatus(),
}));

vi.mock('@/api/metadata', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/metadata')>()),
  fetchMetadata: () => new Promise(() => {}),
}));

vi.mock('@/hooks/useStartCalculationOnLoad', () => ({
  useStartCalculationOnLoad: () => undefined,
}));

vi.mock('@/hooks/useReportValidationSnapshot', () => ({
  useReportValidationSnapshot: () => undefined,
}));

vi.mock('@/components/flagship/CalibrationMatches', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/components/flagship/CalibrationMatches')>()),
  useCalibrationMatches: () => null,
}));

vi.mock('@/components/flagship/ValidationPanel', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/components/flagship/ValidationPanel')>()),
  useModelTrackRecord: () => null,
}));

/** A run that failed: the page then shows the report's title over the error. */
const FAILED_RUN = {
  status: 'error',
  isComplete: false,
  isError: true,
  error: { message: 'The simulation failed' },
  result: null,
};

const SHARED_PATH = `/v2/shared-reports/${ASSOCIATION_IDS.REPORT}`;

function reportData(overrides: Partial<FlagshipReportData> = {}): FlagshipReportData {
  return {
    report: undefined,
    simulations: [],
    policies: [],
    isLoading: false,
    error: null,
    notFound: false,
    failedPolicyIds: [],
    retry: vi.fn(),
    ...overrides,
  };
}

/** Opens a report link; sign-in off unless a session is given. */
function renderPage(link: string, auth?: AuthContextValue) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const page = (
    <QueryClientProvider client={queryClient}>
      <FlagshipReportPage userReportId={link} />
    </QueryClientProvider>
  );
  return render(auth ? <AuthTestProvider value={auth}>{page}</AuthTestProvider> : page);
}

describe('FlagshipReportPage links', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    store.dispatch(clearMetadata());
    mockCalcStatus.mockReturnValue(FAILED_RUN);
    mockUseFlagshipReport.mockImplementation((apiReportId: string) =>
      apiReportId
        ? reportData({ report: EXISTING_REPORT, simulations: EXISTING_SIMULATIONS })
        : reportData()
    );
    fetchMock.mockImplementation(async (url: string) =>
      new URL(url).pathname === SHARED_PATH
        ? itemResponse(sharedReportItem())
        : errorResponse(404, 'not found')
    );
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("given a saved report's link then anyone opens it with its owner's details", async () => {
    // When: opened by someone who never ran it, with sign-in off
    renderPage(ASSOCIATION_IDS.REPORT);

    // Then: the owner's title, over the v1 report the saved report names
    expect(await screen.findByRole('heading', { name: 'CTC to $3,600' })).toBeInTheDocument();
    expect(mockUseFlagshipReport).toHaveBeenLastCalledWith(String(LEGACY_IDS.REPORT));
    const sharedRead = fetchMock.mock.calls.find(([url]) => new URL(url).pathname === SHARED_PATH)!;
    expect(sharedRead[1].headers).not.toHaveProperty('Authorization');
    expect(sharedRead[1].headers).not.toHaveProperty('PolicyEngine-Unauthenticated-User');
  });

  test('given a signed-out browser that did not run it then the link opens the same way', async () => {
    // When
    renderPage(ASSOCIATION_IDS.REPORT, makeAuthValue());

    // Then
    expect(await screen.findByRole('heading', { name: 'CTC to $3,600' })).toBeInTheDocument();
  });

  test('given a link to a deleted report then it says not found', async () => {
    // Given
    fetchMock.mockResolvedValue(errorResponse(404, 'not found'));

    // When
    renderPage(ASSOCIATION_IDS.REPORT);

    // Then
    expect(await screen.findByRole('heading', { name: 'Report not found' })).toBeInTheDocument();
    expect(mockUseFlagshipReport).not.toHaveBeenCalledWith(String(LEGACY_IDS.REPORT));
  });

  test('given an old v1 report link where accounts exist then it no longer opens', () => {
    // When
    renderPage(String(LEGACY_IDS.REPORT), makeAuthValue());

    // Then
    expect(screen.getByText(/old report link, which no longer opens/i)).toBeInTheDocument();
    expect(mockUseFlagshipReport).not.toHaveBeenCalledWith(String(LEGACY_IDS.REPORT));
  });

  test('given a v1 report link with sign-in off then it opens, as nothing is shared', () => {
    // When
    renderPage(String(LEGACY_IDS.REPORT));

    // Then
    expect(mockUseFlagshipReport).toHaveBeenLastCalledWith(String(LEGACY_IDS.REPORT));
    expect(screen.queryByText(/old report link/i)).not.toBeInTheDocument();
  });

  test('given an old browser-only link then it no longer opens', () => {
    // When
    renderPage('sur-mtqcsp78hwc7');

    // Then
    expect(screen.getByText(/old report link, which no longer opens/i)).toBeInTheDocument();
  });
});
