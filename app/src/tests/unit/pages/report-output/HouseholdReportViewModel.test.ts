import { describe, expect, it } from 'vitest';
import { HouseholdReportViewModel } from '@/pages/report-output/HouseholdReportViewModel';
import { mockHouseholdResult } from '@/tests/fixtures/api/householdCalculationMocks';
import { mockExecutionReceipt } from '@/tests/fixtures/types/executionReceiptFixtures';
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

  it('uses the certified policyengine.py version from an execution receipt', () => {
    const executionReceipt = mockExecutionReceipt();
    executionReceipt.resolved.runtime = {
      name: 'policyengine-core',
      version: '3.28.0',
    };
    executionReceipt.resolved.certified_release = {
      schema_version: 1,
      country_id: 'us',
      policyengine_version: '4.20.3',
      model_package: { name: 'policyengine-us', version: '1.768.3' },
      data_package: {
        name: 'populace-data',
        version: '0.1.0',
        repo_id: 'policyengine/populace-us',
        repo_type: 'dataset',
        release_manifest_path: 'release_manifest.json',
      },
      default_dataset: 'populace_us_2024',
      datasets: {},
      region_datasets: {},
    };
    const report: Report = {
      id: 'report-1',
      countryId: 'us',
      year: '2026',
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
          execution_receipt: executionReceipt,
        },
      },
    ];

    const viewModel = new HouseholdReportViewModel(report, simulations, undefined, undefined);

    expect(viewModel.getResolvedPolicyengineVersion()).toBe('4.20.3');
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

  it.each([
    ['pending', { isPending: true, isComplete: false, isError: false }],
    ['error', { isPending: false, isComplete: false, isError: true }],
  ] as const)(
    'given %s simulation with stale output then it is not treated as durable',
    (status, expectedStates) => {
      const report: Report = {
        id: 'report-1',
        countryId: 'us',
        year: '2026',
        apiVersion: null,
        simulationIds: ['sim-1'],
        status: 'pending',
        output: null,
      };
      const simulation: Simulation = {
        id: 'sim-1',
        countryId: 'us',
        label: null,
        isCreated: true,
        status,
        output: { people: { adult: { income_tax: { '2026': 100 } } } },
      };
      const viewModel = new HouseholdReportViewModel(report, [simulation], undefined, undefined);

      expect(viewModel.simulationStates).toEqual(expectedStates);
      expect(viewModel.getHouseholdOutputs()).toEqual([]);
    }
  );

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
