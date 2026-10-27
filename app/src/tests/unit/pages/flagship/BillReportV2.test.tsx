import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { BillEconomy } from '@/hooks/useBillEconomy';
import BillReportPage from '@/pages/flagship/BillReport.page';
import { clearMetadata } from '@/reducers/metadataReducer';
import { store } from '@/store';
import { catalogParametersResult } from '@/tests/fixtures/api/publicApi/catalogParametersMocks';
import {
  jsonResponse,
  requestsTo,
  stubPublicApiFetch,
} from '@/tests/fixtures/api/publicApi/publicApiFetchStub';
import { seedV2ModelCatalog } from '@/tests/fixtures/hooks/v3MetadataWrapper';
import { TRACKED_BILL } from '@/tests/fixtures/libs/flagship/trackedBillMocks';

const mockCalibrationMatchesForPaths = vi.fn();

vi.mock('@/libs/flagship/calibrationMatching', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/libs/flagship/calibrationMatching')>();
  return {
    ...actual,
    calibrationMatchesForPaths: (...args: unknown[]) => mockCalibrationMatchesForPaths(...args),
  };
});

const mockFetchTrackerBills = vi.fn();
const mockFetchTrackerBillDistricts = vi.fn();

vi.mock('@/api/billFeed', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/billFeed')>();
  return {
    ...actual,
    fetchTrackerBills: () => mockFetchTrackerBills(),
    fetchTrackerBillDistricts: (id: string) => mockFetchTrackerBillDistricts(id),
  };
});

vi.mock('@/components/flagship/report/DistrictImpactCard', () => ({
  default: ({ districts, modes }: { districts?: unknown[]; modes?: string[] }) => (
    <div>
      District map: {districts?.length ?? 'full results'} · {modes?.join(', ') ?? 'all views'}
    </div>
  ),
}));

const mockIsAlreadyCurrentLaw = vi.fn();

vi.mock('@/libs/flagship/billMetrics', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/libs/flagship/billMetrics')>();
  return {
    ...actual,
    isAlreadyCurrentLaw: (...args: Parameters<typeof actual.isAlreadyCurrentLaw>) =>
      mockIsAlreadyCurrentLaw(...args) ?? actual.isAlreadyCurrentLaw(...args),
  };
});

const mockUseBillEconomy = vi.fn();
const mockUseV3VariablesInBackground = vi.fn();

/** The real variables hooks, with the page's background load observed. */
vi.mock('@/hooks/useV3Variables', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/useV3Variables')>();
  return {
    ...actual,
    useV3VariablesInBackground: () => {
      mockUseV3VariablesInBackground();
      actual.useV3VariablesInBackground();
    },
  };
});

/** v3 after the switch: V3_API_ROUTES is 'v2'. */
vi.mock('@/libs/flagship/v3ApiRoutes', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/libs/flagship/v3ApiRoutes')>()),
  V3_API_ROUTES: 'v2',
}));

vi.mock('@/hooks/useBillEconomy', () => ({
  useBillEconomy: (...args: unknown[]) => mockUseBillEconomy(...args),
}));

vi.mock('@/components/flagship/report/EconomicImpactCharts', () => ({
  default: () => <div>Economic impact charts</div>,
}));

const mockRetry = vi.fn();

function economy(overrides: Partial<BillEconomy> = {}): BillEconomy {
  return {
    output: null,
    status: 'pending',
    reformPolicyId: '98557',
    baselinePolicyId: '2',
    year: '2026',
    region: 'us',
    retry: mockRetry,
    ...overrides,
  };
}

function renderReport(billId = 'us-hr1425') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <BillReportPage billId={billId} />
    </QueryClientProvider>
  );
}

const PARAMETERS_PATH = '/v2/model-catalog/parameters';
const BILL_PARAMETER = TRACKED_BILL.provisions[0].path;

describe('BillReportPage with v3 on the v2 routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchTrackerBills.mockResolvedValue([TRACKED_BILL]);
    mockFetchTrackerBillDistricts.mockResolvedValue(null);
    mockUseBillEconomy.mockReturnValue(economy());
    mockCalibrationMatchesForPaths.mockResolvedValue([]);
    mockIsAlreadyCurrentLaw.mockReturnValue(undefined);
  });

  afterEach(() => {
    store.dispatch(clearMetadata());
    vi.unstubAllGlobals();
  });

  test("given a bill then its provisions' parameters load in one request", async () => {
    // Given
    const fetchStub = stubPublicApiFetch({
      [PARAMETERS_PATH]: (url) =>
        jsonResponse({
          status: 'ok',
          message: null,
          result: catalogParametersResult(url.searchParams.getAll('name')),
        }),
    });
    await seedV2ModelCatalog();

    // When
    renderReport();

    // Then
    await waitFor(() => expect(requestsTo(fetchStub, PARAMETERS_PATH)).toHaveLength(1));
    expect(requestsTo(fetchStub, PARAMETERS_PATH)[0].searchParams.getAll('name')).toEqual([
      BILL_PARAMETER,
    ]);
  });

  test('given the parameters failed to load then try again asks for them again', async () => {
    // Given
    const user = userEvent.setup();
    let attempts = 0;
    const fetchStub = stubPublicApiFetch({
      [PARAMETERS_PATH]: (url) => {
        attempts += 1;
        return attempts === 1
          ? jsonResponse({ status: 'error', message: 'Unavailable' }, 503)
          : jsonResponse({
              status: 'ok',
              message: null,
              result: catalogParametersResult(url.searchParams.getAll('name')),
            });
      },
    });
    await seedV2ModelCatalog();
    renderReport();
    await user.click(await screen.findByRole('tab', { name: 'Economic impacts' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the parameters');

    // When
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    // Then
    await waitFor(() => expect(requestsTo(fetchStub, PARAMETERS_PATH)).toHaveLength(2));
    await waitFor(() =>
      expect(screen.queryByText('Could not load the parameters')).not.toBeInTheDocument()
    );
  });

  test('given the page renders then it starts loading the variables in the background', async () => {
    // Given
    stubPublicApiFetch({
      [PARAMETERS_PATH]: (url) =>
        jsonResponse({
          status: 'ok',
          message: null,
          result: catalogParametersResult(url.searchParams.getAll('name')),
        }),
    });
    await seedV2ModelCatalog();

    // When
    renderReport();

    // Then
    expect(mockUseV3VariablesInBackground).toHaveBeenCalled();
  });
});
