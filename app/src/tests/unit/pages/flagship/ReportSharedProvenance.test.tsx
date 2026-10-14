import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { FlagshipReportData } from '@/hooks/useFlagshipReport';
import FlagshipReportPage from '@/pages/flagship/Report.page';
import { clearMetadata, fetchMetadataThunk } from '@/reducers/metadataReducer';
import { store } from '@/store';
import {
  BASELINE_SIMULATION_ID,
  EXISTING_REPORT,
  EXISTING_REPORT_ID,
  REFORM_SIMULATION_ID,
} from '@/tests/fixtures/hooks/useFlagshipReportMocks';
import { createMockSocietyWideOutput } from '@/tests/fixtures/pages/reportOutputMocks';
import type { Policy } from '@/types/ingredients/Policy';
import type { Simulation } from '@/types/ingredients/Simulation';

const mockUseFlagshipReport = vi.fn();
const mockCalcStatus = vi.fn();

vi.mock('@/hooks/useFlagshipReport', () => ({
  isApiReportId: () => true,
  useFlagshipReport: () => mockUseFlagshipReport(),
}));

vi.mock('@/hooks/useCalculationStatus', () => ({
  useCalculationStatus: () => mockCalcStatus(),
}));

vi.mock('@/api/metadata', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/metadata')>()),
  fetchMetadata: () => new Promise(() => {}),
}));

vi.mock('@/api/budgetWindow', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/budgetWindow')>()),
  fetchBudgetWindow: async () => ({ status: 'computing', result: null, progress: 10 }),
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

const MD_CTC_PATH = 'gov.states.md.tax.income.credits.ctc.amount';
const REFORM_POLICY_ID = '98731';

/** Current law for the Maryland CTC: $500 a child, rising to $550 in 2030. */
function seedMarylandMetadata() {
  const meta = { arg: 'us', requestId: 'shared-provenance-test', requestStatus: 'pending' };
  store.dispatch({ type: fetchMetadataThunk.pending.type, meta });
  store.dispatch({
    type: fetchMetadataThunk.fulfilled.type,
    meta: { ...meta, requestStatus: 'fulfilled' },
    payload: {
      country: 'us',
      data: {
        result: {
          parameters: {
            [MD_CTC_PATH]: {
              parameter: MD_CTC_PATH,
              type: 'parameter',
              label: 'Maryland Child Tax Credit amount per eligible child',
              unit: 'currency-USD',
              period: 'year',
              values: { '2023-01-01': 500, '2030-01-01': 550 },
            },
          },
          variables: {},
          entities: {},
          variableModules: {},
          economy_options: { region: [], time_period: [], datasets: [] },
          current_law_id: 2,
          basicInputs: [],
          modelled_policies: { core: {}, filtered: {} },
          version: '1.0.0',
        },
      },
    },
  });
}

/** A reform that starts in 2027 and steps up over time, as policy 98731 does. */
const DATED_REFORM: Policy = {
  id: REFORM_POLICY_ID,
  countryId: 'us',
  label: 'MD CTC Increase',
  parameters: [
    {
      name: MD_CTC_PATH,
      values: [
        { startDate: '2027-01-01', endDate: '2027-12-31', value: 600 },
        { startDate: '2028-01-01', endDate: '2029-12-31', value: 614 },
        { startDate: '2030-01-01', endDate: '2100-12-31', value: 643 },
      ],
    },
  ],
};

const simulation = (id: string, policyId: string): Simulation => ({
  id,
  countryId: 'us',
  apiVersion: 'v1',
  policyId,
  populationId: 'state/md',
  populationType: 'geography',
  label: null,
  isCreated: true,
  status: 'complete',
});

function sharedReport(year: string): FlagshipReportData {
  return {
    report: { ...EXISTING_REPORT, label: 'MD CTC Increase', year },
    simulations: [
      simulation(BASELINE_SIMULATION_ID, '2'),
      simulation(REFORM_SIMULATION_ID, REFORM_POLICY_ID),
    ],
    policies: [DATED_REFORM],
    isLoading: false,
    error: null,
    notFound: false,
    failedPolicyIds: [],
    retry: vi.fn(),
  };
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <FlagshipReportPage userReportId={EXISTING_REPORT_ID} />
    </QueryClientProvider>
  );
}

describe('FlagshipReportPage opened from a shared link', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // No local stash: the provisions are rebuilt from the reform policy.
    localStorage.clear();
    store.dispatch(clearMetadata());
    seedMarylandMetadata();
    mockCalcStatus.mockReturnValue({
      status: 'complete',
      isComplete: true,
      isError: false,
      result: createMockSocietyWideOutput(),
    });
  });

  test('given a 2030 report then the policy changes read current law and the reform in 2030', () => {
    // Given
    mockUseFlagshipReport.mockReturnValue(sharedReport('2030'));

    // When
    renderPage();

    // Then
    const changes = screen.getByRole('region', { name: 'Policy changes' });
    const [row] = within(changes).getAllByRole('row').slice(1);
    const cells = within(row).getAllByRole('cell');
    expect(cells.map((cell) => cell.textContent)).toEqual([
      '$550',
      '$643',
      'Jan 1, 2027',
      'No end date',
    ]);
  });
});
