import { render, screen } from '@test-utils';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useFinalizeHouseholdReportOnLoad } from '@/hooks/household';
import { useStartCalculationOnLoad } from '@/hooks/useStartCalculationOnLoad';
import { Household } from '@/models/Household';
import { HouseholdReportOutput } from '@/pages/report-output/HouseholdReportOutput';
import type { Report } from '@/types/ingredients/Report';
import type { Simulation } from '@/types/ingredients/Simulation';

vi.mock('@/hooks/household', () => ({
  useFinalizeHouseholdReportOnLoad: vi.fn(),
  useSimulationProgressDisplay: () => ({
    displayProgress: 0,
    hasCalcStatus: false,
    message: null,
  }),
}));

vi.mock('@/hooks/useStartCalculationOnLoad', () => ({
  useStartCalculationOnLoad: vi.fn(),
}));

vi.mock('@/pages/report-output/reproduce-in-python/HouseholdReproducibility', () => ({
  default: ({ household }: { household: Household | null }) => (
    <div data-testid="repro-household-id">{household?.id ?? 'none'}</div>
  ),
}));

const report: Report = {
  id: 'report-1',
  countryId: 'us',
  year: '2026',
  apiVersion: null,
  simulationIds: ['simulation-baseline', 'simulation-reform'],
  status: 'complete',
  outputType: 'household',
  output: null,
};

const baselineSimulation: Simulation = {
  id: 'simulation-baseline',
  countryId: 'us',
  policyId: 'policy-baseline',
  populationId: 'household-baseline',
  populationType: 'household',
  label: 'Baseline',
  isCreated: true,
  status: 'complete',
  output: null,
};

const reformSimulation: Simulation = {
  id: 'simulation-reform',
  countryId: 'us',
  policyId: 'policy-reform',
  populationId: 'household-reform',
  populationType: 'household',
  label: 'Reform',
  isCreated: true,
  status: 'complete',
  output: null,
};

function makeHousehold(id: string): Household {
  return Household.fromAppInput({
    id,
    countryId: 'us',
    year: 2026,
    householdData: {
      people: {
        you: {
          age: { '2026': 30 },
        },
      },
      households: {
        household: {
          members: ['you'],
        },
      },
    },
  });
}

describe('HouseholdReportOutput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useFinalizeHouseholdReportOnLoad).mockReturnValue({
      finalizationError: null,
      retryFinalization: vi.fn(),
    });
    vi.mocked(useStartCalculationOnLoad).mockReturnValue({
      persistenceError: null,
      retryFailedPersistence: vi.fn(),
    });
  });

  test('given pending simulations then delegates execution to the managed orchestrator', () => {
    // Given
    const pendingReport = { ...report, status: 'pending' as const };
    const pendingSimulations = [baselineSimulation, reformSimulation].map((simulation) => ({
      ...simulation,
      status: 'pending' as const,
      output: null,
    }));

    // When
    render(
      <HouseholdReportOutput
        report={pendingReport}
        simulations={pendingSimulations}
        households={[makeHousehold('household-reform'), makeHousehold('household-baseline')]}
        subpage="overview"
        isLoading={false}
        error={null}
      />
    );

    // Then
    expect(vi.mocked(useStartCalculationOnLoad)).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: true,
        isComplete: false,
        configs: [
          expect.objectContaining({
            calcId: 'simulation-baseline',
            reportId: 'report-1',
            targetType: 'simulation',
          }),
          expect.objectContaining({
            calcId: 'simulation-reform',
            reportId: 'report-1',
            targetType: 'simulation',
          }),
        ],
      })
    );
  });

  test('given reproduce tab then passes the baseline simulation household by population ID', () => {
    render(
      <HouseholdReportOutput
        report={report}
        simulations={[baselineSimulation, reformSimulation]}
        households={[makeHousehold('household-reform'), makeHousehold('household-baseline')]}
        subpage="reproduce"
        isLoading={false}
        error={null}
      />
    );

    expect(screen.getByTestId('repro-household-id')).toHaveTextContent('household-baseline');
  });

  test('test__given_all_outputs_are_durable_on_load__then_report_finalizes_without_recalculation', () => {
    // Given
    const pendingReport = { ...report, status: 'pending' as const };
    const durableSimulations = [baselineSimulation, reformSimulation].map((simulation) => ({
      ...simulation,
      output: { people: { adult: { income_tax: { '2026': 100 } } } },
    }));

    // When
    render(
      <HouseholdReportOutput
        report={pendingReport}
        simulations={durableSimulations}
        subpage="policy"
        isLoading={false}
        error={null}
      />
    );

    // Then
    expect(vi.mocked(useFinalizeHouseholdReportOnLoad)).toHaveBeenCalledWith({
      report: pendingReport,
      simulations: durableSimulations,
    });
    expect(vi.mocked(useStartCalculationOnLoad)).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
        configs: [],
        isComplete: true,
      })
    );
  });

  test('test__given_result_save_failed__then_user_can_retry_without_recalculating', async () => {
    // Given
    const user = userEvent.setup();
    const retryFailedPersistence = vi.fn();
    vi.mocked(useStartCalculationOnLoad).mockReturnValue({
      persistenceError: new Error('Database unavailable'),
      retryFailedPersistence,
    });
    const pendingReport = { ...report, status: 'pending' as const };
    const pendingSimulations = [baselineSimulation, reformSimulation].map((simulation) => ({
      ...simulation,
      status: 'pending' as const,
      output: null,
    }));

    // When
    render(
      <HouseholdReportOutput
        report={pendingReport}
        simulations={pendingSimulations}
        subpage="overview"
        isLoading={false}
        error={null}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Retry saving results' }));

    // Then
    expect(retryFailedPersistence).toHaveBeenCalledOnce();
  });

  test('test__given_report_finalization_failed__then_user_can_retry_the_report_save', async () => {
    // Given
    const user = userEvent.setup();
    const retryFinalization = vi.fn();
    vi.mocked(useFinalizeHouseholdReportOnLoad).mockReturnValue({
      finalizationError: new Error('Report save failed'),
      retryFinalization,
    });

    // When
    render(
      <HouseholdReportOutput
        report={{ ...report, status: 'pending' }}
        simulations={[baselineSimulation, reformSimulation]}
        subpage="overview"
        isLoading={false}
        error={null}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Retry saving report' }));

    // Then
    expect(retryFinalization).toHaveBeenCalledOnce();
  });
});
