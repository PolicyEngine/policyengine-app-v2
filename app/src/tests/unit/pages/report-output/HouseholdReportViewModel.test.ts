import { describe, expect, it } from 'vitest';
import { HouseholdReportViewModel } from '@/pages/report-output/HouseholdReportViewModel';
import type { Simulation } from '@/types/ingredients/Simulation';

describe('HouseholdReportViewModel', () => {
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
