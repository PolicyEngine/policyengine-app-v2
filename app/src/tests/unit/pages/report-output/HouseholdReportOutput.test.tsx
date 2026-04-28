import { render, screen } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import { Household } from '@/models/Household';
import { HouseholdReportOutput } from '@/pages/report-output/HouseholdReportOutput';
import type { Report } from '@/types/ingredients/Report';
import type { Simulation } from '@/types/ingredients/Simulation';

vi.mock('@/hooks/household', () => ({
  useSimulationProgressDisplay: () => ({
    displayProgress: 0,
    hasCalcStatus: false,
    message: null,
  }),
}));

vi.mock('@/pages/report-output/useHouseholdCalculations', () => ({
  useHouseholdCalculations: () => ({ orchestrator: null }),
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
});
