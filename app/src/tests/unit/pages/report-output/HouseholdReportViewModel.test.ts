import { describe, expect, it } from 'vitest';
import { HouseholdReportViewModel } from '@/pages/report-output/HouseholdReportViewModel';
import { mockHouseholdResult } from '@/tests/fixtures/api/householdCalculationMocks';
import type { Report } from '@/types/ingredients/Report';
import type { Simulation } from '@/types/ingredients/Simulation';

describe('HouseholdReportViewModel', () => {
  it('unwraps persisted household calculation wrappers for report output', () => {
    const report: Report = {
      id: 'report-1',
      countryId: 'us',
      year: '2025',
      apiVersion: '1.0',
      simulationIds: ['sim-1'],
      status: 'complete',
      outputType: 'household',
      output: null,
    };
    const simulations: Simulation[] = [
      {
        id: 'sim-1',
        countryId: 'us',
        label: 'Baseline',
        isCreated: true,
        status: 'complete',
        output: {
          result: mockHouseholdResult.householdData,
          policyengine_bundle: {
            policyengine_version: '3.4.1',
          },
        },
      },
    ];

    const viewModel = new HouseholdReportViewModel(report, simulations, undefined, undefined);

    expect(viewModel.getHouseholdOutputs()).toEqual([
      {
        id: 'sim-1',
        countryId: 'us',
        householdData: mockHouseholdResult.householdData,
      },
    ]);
  });

  it('prefers simulation bundle provenance over report-level fallback', () => {
    const report: Report = {
      id: 'report-1',
      countryId: 'us',
      year: '2025',
      apiVersion: '1.0',
      simulationIds: ['sim-1'],
      status: 'complete',
      outputType: 'household',
      output: {
        policyengine_version: 'stale-version',
      } as never,
    };
    const simulations: Simulation[] = [
      {
        id: 'sim-1',
        countryId: 'us',
        label: 'Baseline',
        isCreated: true,
        status: 'complete',
        output: {
          result: mockHouseholdResult.householdData,
          policyengine_bundle: {
            policyengine_version: '3.4.1',
          },
        },
      },
    ];

    const viewModel = new HouseholdReportViewModel(report, simulations, undefined, undefined);

    expect(viewModel.getResolvedPolicyengineVersion()).toBe('3.4.1');
  });

  it('given persisted household output without a complete status then treats the simulation as complete', () => {
    const simulation: Simulation = {
      id: 'sim-1',
      countryId: 'uk',
      apiVersion: '1.0.0',
      policyId: '1',
      populationId: 'household-1',
      populationType: 'household',
      label: null,
      isCreated: true,
      output: { household_net_income: { 2026: 30000 } },
    };

    const viewModel = new HouseholdReportViewModel(
      {
        id: 'report-1',
        countryId: 'uk',
        year: '2026',
        apiVersion: '1.0.0',
        simulationIds: ['sim-1'],
        status: 'complete',
        output: null,
      },
      [simulation],
      [],
      []
    );

    expect(viewModel.simulationStates).toEqual({
      isPending: false,
      isComplete: true,
      isError: false,
    });
  });

  it('given simulation without output or completion then keeps the report pending', () => {
    const simulation: Simulation = {
      id: 'sim-1',
      countryId: 'uk',
      apiVersion: '1.0.0',
      policyId: '1',
      populationId: 'household-1',
      populationType: 'household',
      label: null,
      isCreated: true,
      output: null,
      status: 'pending',
    };

    const viewModel = new HouseholdReportViewModel(
      {
        id: 'report-1',
        countryId: 'uk',
        year: '2026',
        apiVersion: '1.0.0',
        simulationIds: ['sim-1'],
        status: 'pending',
        output: null,
      },
      [simulation],
      [],
      []
    );

    expect(viewModel.simulationStates).toEqual({
      isPending: true,
      isComplete: false,
      isError: false,
    });
  });
});
