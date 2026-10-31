import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { FlagshipReportData } from '@/hooks/useFlagshipReport';
import FlagshipReportPage from '@/pages/flagship/Report.page';
import { clearMetadata } from '@/reducers/metadataReducer';
import { store } from '@/store';
import { catalogParametersResult } from '@/tests/fixtures/api/publicApi/catalogParametersMocks';
import {
  jsonResponse,
  requestsTo,
  stubPublicApiFetch,
} from '@/tests/fixtures/api/publicApi/publicApiFetchStub';
import { STANDARD_DEDUCTION_SINGLE } from '@/tests/fixtures/api/publicApi/searchFileMocks';
import { REFORM_POLICY } from '@/tests/fixtures/api/publicApi/v2ReportPolicyMocks';
import {
  EXISTING_REPORT,
  EXISTING_REPORT_ID,
  EXISTING_SIMULATIONS,
} from '@/tests/fixtures/hooks/useFlagshipReportMocks';
import { seedV2ModelCatalog } from '@/tests/fixtures/hooks/v3MetadataWrapper';
import { createMockSocietyWideOutput } from '@/tests/fixtures/pages/reportOutputMocks';

const mockUseFlagshipReport = vi.fn();
const mockRetry = vi.fn();
const mockCalcStatus = vi.fn();
const mockStartCalculationOnLoad = vi.fn();

vi.mock('@/hooks/useFlagshipReport', () => ({
  isApiReportId: () => true,
  useFlagshipReport: () => mockUseFlagshipReport(),
}));

vi.mock('@/hooks/useCalculationStatus', () => ({
  useCalculationStatus: () => mockCalcStatus(),
}));

/** v3 after the switch: V3_API_ROUTES is 'v2'. */
vi.mock('@/libs/flagship/v3ApiRoutes', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/libs/flagship/v3ApiRoutes')>()),
  V3_API_ROUTES: 'v2',
}));

vi.mock('@/hooks/useStartCalculationOnLoad', () => ({
  useStartCalculationOnLoad: (args: unknown) => mockStartCalculationOnLoad(args),
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

/** What the report hook returns before anything has loaded. */
function reportData(overrides: Partial<FlagshipReportData> = {}): FlagshipReportData {
  return {
    report: undefined,
    simulations: [],
    policies: [],
    isLoading: false,
    error: null,
    notFound: false,
    failedPolicyIds: [],
    retry: mockRetry,
    ...overrides,
  };
}

function renderPage(userReportId: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <FlagshipReportPage userReportId={userReportId} />
    </QueryClientProvider>
  );
}

const PARAMETERS_PATH = '/v2/model-catalog/parameters';
const COMPLETE_STATUS = {
  status: 'complete',
  isComplete: true,
  isError: false,
  result: createMockSocietyWideOutput(),
};

function answerParameters(url: URL) {
  return jsonResponse({
    status: 'ok',
    message: null,
    result: catalogParametersResult(url.searchParams.getAll('name')),
  });
}

describe('FlagshipReportPage with v3 on the v2 routes', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    store.dispatch(clearMetadata());
    mockCalcStatus.mockReturnValue(COMPLETE_STATUS);
    mockUseFlagshipReport.mockReturnValue(
      reportData({
        report: EXISTING_REPORT,
        simulations: EXISTING_SIMULATIONS,
        policies: [REFORM_POLICY],
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("given the report's policies then its reform's parameters load in one request", async () => {
    // Given
    const fetchStub = stubPublicApiFetch({ [PARAMETERS_PATH]: answerParameters });
    await seedV2ModelCatalog();

    // When
    renderPage(EXISTING_REPORT_ID);

    // Then
    await waitFor(() => expect(requestsTo(fetchStub, PARAMETERS_PATH)).toHaveLength(1));
    expect(requestsTo(fetchStub, PARAMETERS_PATH)[0].searchParams.getAll('name')).toEqual([
      STANDARD_DEDUCTION_SINGLE,
    ]);
  });

  test('given the parameters failed then the overview says so and try again asks again', async () => {
    // Given
    const user = userEvent.setup();
    let attempts = 0;
    const fetchStub = stubPublicApiFetch({
      [PARAMETERS_PATH]: (url) => {
        attempts += 1;
        return attempts === 1
          ? jsonResponse({ status: 'error', message: 'Unavailable' }, 503)
          : answerParameters(url);
      },
    });
    await seedV2ModelCatalog();
    renderPage(EXISTING_REPORT_ID);
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the parameters');

    // When
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    // Then
    await waitFor(() => expect(requestsTo(fetchStub, PARAMETERS_PATH)).toHaveLength(2));
    await waitFor(() =>
      expect(screen.queryByText('Could not load the parameters')).not.toBeInTheDocument()
    );
  });
});
