import { QueryClientProvider } from '@tanstack/react-query';
import { renderWithCountry, screen, userEvent, waitFor, within } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import ReformsPage from '@/pages/flagship/Reforms.page';
import { clearMetadata } from '@/reducers/metadataReducer';
import { store } from '@/store';
import { catalogParametersResult } from '@/tests/fixtures/api/publicApi/catalogParametersMocks';
import {
  jsonResponse,
  requestsTo,
  stubPublicApiFetch,
} from '@/tests/fixtures/api/publicApi/publicApiFetchStub';
import { STANDARD_DEDUCTION_SINGLE } from '@/tests/fixtures/api/publicApi/searchFileMocks';
import { seedV2ModelCatalog, testQueryClient } from '@/tests/fixtures/hooks/v3MetadataWrapper';
import {
  REMOVED_US_PARAMETER,
  v1PolicyContent,
} from '@/tests/fixtures/libs/flagship/missingParametersMocks';
import { REMOVED_PROVISION } from '@/tests/fixtures/libs/flagship/missingParameterTransferMocks';
import { TRACKED_BILL } from '@/tests/fixtures/libs/flagship/trackedBillMocks';
import type { Reform } from '@/types/ingredients/Reform';

/** v3 after the switch: V3_API_ROUTES is 'v2'. */
vi.mock('@/libs/flagship/v3ApiRoutes', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/libs/flagship/v3ApiRoutes')>()),
  V3_API_ROUTES: 'v2',
}));

const mockFindMine = vi.fn();
vi.mock('@/api/reformStore', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/reformStore')>()),
  getReformStore: () => ({ findMine: mockFindMine }),
}));

const mockRun = vi.fn();
vi.mock('@/hooks/useRunFlagshipReport', () => ({
  useRunFlagshipReport: () => ({ run: mockRun, isRunning: false, error: null }),
}));

const mockFindReports = vi.fn();
vi.mock('@/api/flagshipReportStore', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/flagshipReportStore')>()),
  getFlagshipReportStore: () => ({ findMine: mockFindReports }),
}));

// A saved report's v1 records, which Re-run reads: the report, its
// simulations and their policies (each with nothing missing).
vi.mock('@/api/report', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/report')>()),
  fetchReportById: async (_countryId: string, reportId: string) => ({
    id: reportId,
    status: 'complete',
    year: '2026',
    simulation_1_id: '9',
    simulation_2_id: '10',
  }),
}));
vi.mock('@/api/simulation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/simulation')>()),
  fetchSimulationById: async () => ({
    population_type: 'geography',
    population_id: 'us',
    policy_id: '88',
  }),
}));
vi.mock('@/api/policy', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/policy')>()),
  fetchPolicyById: async () => v1PolicyContent({}, []),
}));

const mockFetchTrackerBills = vi.fn();
vi.mock('@/api/billFeed', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/billFeed')>()),
  fetchTrackerBills: () => mockFetchTrackerBills(),
}));

const PARAMETERS_PATH = '/v2/model-catalog/parameters';

const DEDUCTION_REFORM: Reform = {
  id: 'rf-1',
  countryId: 'us',
  label: 'A larger standard deduction',
  parameters: [
    {
      name: STANDARD_DEDUCTION_SINGLE,
      values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 20000 }],
    },
  ],
  baseline: 'current-law',
  provenance: { source: 'manual' },
  updatedAt: '2026-08-01T00:00:00Z',
};

/** A bill the tracker has not scored, so its detail offers a report run. */
const UNSCORED_BILL = {
  ...TRACKED_BILL,
  impactData: undefined,
  provisions: [{ path: STANDARD_DEDUCTION_SINGLE, value: 20000 }],
};

function renderReforms(path: string) {
  renderWithCountry(
    <QueryClientProvider client={testQueryClient()}>
      <ReformsPage />
    </QueryClientProvider>,
    'us',
    path
  );
}

function billActions() {
  return [
    screen.getByRole('button', { name: /Run impact report/ }),
    screen.getByRole('button', { name: /Open as draft reform/ }),
  ];
}

describe('ReformsPage with v3 on the v2 routes', () => {
  let fetchStub: ReturnType<typeof stubPublicApiFetch>;
  /** Answers the held parameters request. */
  let releaseParameters: () => void;

  beforeEach(async () => {
    const held = new Promise<void>((resolve) => {
      releaseParameters = resolve;
    });
    fetchStub = stubPublicApiFetch({
      [PARAMETERS_PATH]: async (url) => {
        await held;
        return jsonResponse({
          status: 'ok',
          message: null,
          result: catalogParametersResult(url.searchParams.getAll('name')),
        });
      },
    });
    await seedV2ModelCatalog();
    mockFindMine.mockResolvedValue([DEDUCTION_REFORM]);
    mockFindReports.mockResolvedValue([]);
    mockRun.mockReset();
    mockFetchTrackerBills.mockResolvedValue([UNSCORED_BILL]);
  });

  afterEach(() => {
    store.dispatch(clearMetadata());
    vi.unstubAllGlobals();
  });

  test('given a saved reform opens then its parameters load in one request, rows waiting for them', async () => {
    // Given
    const user = userEvent.setup();
    renderWithCountry(
      <QueryClientProvider client={testQueryClient()}>
        <ReformsPage />
      </QueryClientProvider>,
      'us',
      '/us/reforms?filter=yours'
    );

    // When
    await user.click(await screen.findByText('A larger standard deduction'));

    // Then
    const table = screen.getByRole('table', { name: 'Parameters' });
    expect(within(table).getByRole('status', { name: 'Loading parameters' })).toBeInTheDocument();
    releaseParameters();
    await waitFor(() =>
      expect(
        within(table).queryByRole('status', { name: 'Loading parameters' })
      ).not.toBeInTheDocument()
    );
    const requests = requestsTo(fetchStub, PARAMETERS_PATH);
    expect(requests).toHaveLength(1);
    expect(requests[0].searchParams.getAll('name')).toEqual([STANDARD_DEDUCTION_SINGLE]);
    // Current law, from the catalog: $15,000 since 2025.
    expect(within(table).getByText('$15,000')).toBeInTheDocument();
  });

  test("given a bill opens then its actions wait for its provisions' parameters", async () => {
    // When
    renderReforms(`/us/reforms?bill=${UNSCORED_BILL.id}`);

    // Then
    expect(await screen.findByRole('status', { name: 'Loading parameters' })).toBeInTheDocument();
    for (const action of billActions()) {
      expect(action).toBeDisabled();
    }
    releaseParameters();
    await waitFor(() =>
      expect(screen.queryByRole('status', { name: 'Loading parameters' })).not.toBeInTheDocument()
    );
    for (const action of billActions()) {
      expect(action).toBeEnabled();
    }
    expect(requestsTo(fetchStub, PARAMETERS_PATH)[0].searchParams.getAll('name')).toEqual([
      STANDARD_DEDUCTION_SINGLE,
    ]);
  });

  test("given a bill's parameters fail to load then its detail says so and try again asks again", async () => {
    // Given
    const user = userEvent.setup();
    let attempts = 0;
    fetchStub = stubPublicApiFetch({
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
    renderReforms(`/us/reforms?bill=${UNSCORED_BILL.id}`);
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the parameters');
    for (const action of billActions()) {
      expect(action).toBeDisabled();
    }

    // When
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    // Then
    await waitFor(() => expect(requestsTo(fetchStub, PARAMETERS_PATH)).toHaveLength(2));
    await waitFor(() => {
      for (const action of billActions()) {
        expect(action).toBeEnabled();
      }
    });
    expect(screen.queryByText('Could not load the parameters')).not.toBeInTheDocument();
  });

  test("given a saved reform's parameters fail to load then its detail says so, its run waiting", async () => {
    // Given
    const user = userEvent.setup();
    let attempts = 0;
    fetchStub = stubPublicApiFetch({
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
    renderReforms('/us/reforms?filter=yours');
    await user.click(await screen.findByText('A larger standard deduction'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the parameters');
    expect(screen.getByRole('button', { name: /View full impact report/ })).toBeDisabled();

    // When
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    // Then
    const table = await screen.findByRole('table', { name: 'Parameters' });
    expect(await within(table).findByText('$15,000')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /View full impact report/ })).toBeEnabled();
    expect(requestsTo(fetchStub, PARAMETERS_PATH)).toHaveLength(2);
  });
  test("given a report's changes include a parameter the catalog lacks, which its reform no longer sets, then Re-run names it and runs nothing", async () => {
    // Given: the report ran a change its saved reform has since dropped,
    // and the API finds nothing missing in the policies it reads
    releaseParameters();
    mockFindReports.mockResolvedValue([
      {
        id: 'lfr-local1',
        countryId: 'us',
        apiReportId: '902',
        title: 'Standard deduction',
        sourceNote: 'Hand-built',
        provisions: [
          {
            path: STANDARD_DEDUCTION_SINGLE,
            breadcrumb: 'IRS → Deductions → Standard deduction → Single',
            unit: 'currency-USD',
            baselineValue: 15000,
            value: 20000,
            intervals: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 20000 }],
          },
          REMOVED_PROVISION,
        ],
        year: '2026',
        createdAt: '2026-10-14T09:00:00Z',
        reformId: DEDUCTION_REFORM.id,
      },
    ]);
    const user = userEvent.setup();
    renderReforms('/us/reforms?filter=yours');
    await user.click(await screen.findByText('A larger standard deduction'));

    // When
    await user.click(await screen.findByRole('button', { name: /re-run/i }));

    // Then
    const dialog = await screen.findByRole('dialog', {
      name: 'This report uses parameters the model no longer has',
    });
    expect(
      within(dialog)
        .getAllByRole('listitem')
        .map((item) => item.textContent)
    ).toEqual([REMOVED_US_PARAMETER]);
    expect(mockRun).not.toHaveBeenCalled();
  });
});
