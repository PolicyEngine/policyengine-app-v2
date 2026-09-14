import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import { Household } from '@/models/Household';
import type { ReportBuilderState } from '@/pages/reportBuilder/types';
import { hydrateReportBuilderState } from '@/pages/reportBuilder/utils/hydrateReportBuilderState';
import metadataReducer from '@/reducers/metadataReducer';
import { ownershipHydrationData } from '@/tests/fixtures/spm/reportBuilderOwnershipMocks';
import type { Simulation } from '@/types/ingredients/Simulation';

// Test constants
export const TEST_SIMULATION_IDS = {
  SIM_NEW_1: 'new-sim-1',
  SIM_NEW_2: 'new-sim-2',
} as const;

export const TEST_POLICY_IDS = {
  SECOND_REFORM_POLICY: 'policy-reform-2',
  REFORM_POLICY: 'policy-reform-1',
  CURRENT_LAW: 'current-law',
} as const;

export const REPORT_PARAMETER_NAME = 'gov.test.report.amount';
export const REPORT_CURRENT_LAW_METADATA = {
  [REPORT_PARAMETER_NAME]: {
    type: 'parameter',
    parameter: REPORT_PARAMETER_NAME,
    values: { '2020-01-01': 100 },
  },
  'gov.test.parameter': {
    type: 'parameter',
    parameter: 'gov.test.parameter',
    values: { '2020-01-01': 0 },
  },
};
export const REPORT_EFFECTIVE_PARAMETERS = [
  {
    name: REPORT_PARAMETER_NAME,
    values: [{ startDate: '2026-01-01', endDate: '9999-12-31', value: 150 }],
  },
];

export const TEST_POPULATION = {
  GEOGRAPHY_ID: 'us',
  HOUSEHOLD_ID: 'household-abc',
} as const;

export const TEST_LABELS = {
  BASELINE: 'Baseline',
  REFORM: 'My Reform',
  REPORT: 'Test Report',
} as const;

export const CURRENT_LAW_ID = 2;

// Mock API responses
export const mockCreateSimulationResponse = (simulationId: string) => ({
  result: { simulation_id: simulationId },
});

// Mock ReportBuilderState for a single-simulation report
export const mockSingleSimReportState: ReportBuilderState = {
  label: TEST_LABELS.REPORT,
  year: '2026',
  simulations: [
    {
      label: TEST_LABELS.BASELINE,
      policy: {
        id: TEST_POLICY_IDS.REFORM_POLICY,
        label: 'Reform',
        parameters: REPORT_EFFECTIVE_PARAMETERS,
      },
      population: {
        label: 'US',
        type: 'geography',
        geography: {
          id: TEST_POPULATION.GEOGRAPHY_ID,
          geographyId: TEST_POPULATION.GEOGRAPHY_ID,
          scope: 'national',
          countryId: 'us',
          name: 'US',
        },
        household: null,
      },
    },
  ],
};

// Mock ReportBuilderState for a two-simulation report
export const mockTwoSimReportState: ReportBuilderState = {
  label: TEST_LABELS.REPORT,
  year: '2026',
  simulations: [
    {
      label: TEST_LABELS.BASELINE,
      policy: { id: TEST_POLICY_IDS.CURRENT_LAW, label: 'Current law', parameters: [] },
      population: {
        label: 'US',
        type: 'geography',
        geography: {
          id: TEST_POPULATION.GEOGRAPHY_ID,
          geographyId: TEST_POPULATION.GEOGRAPHY_ID,
          scope: 'national',
          countryId: 'us',
          name: 'US',
        },
        household: null,
      },
    },
    {
      label: TEST_LABELS.REFORM,
      policy: {
        id: TEST_POLICY_IDS.REFORM_POLICY,
        label: 'Reform',
        parameters: REPORT_EFFECTIVE_PARAMETERS,
      },
      population: {
        label: 'US',
        type: 'geography',
        geography: {
          id: TEST_POPULATION.GEOGRAPHY_ID,
          geographyId: TEST_POPULATION.GEOGRAPHY_ID,
          scope: 'national',
          countryId: 'us',
          name: 'US',
        },
        household: null,
      },
    },
  ],
};

export const mockCurrentLawSingleSimReportState: ReportBuilderState = {
  ...mockSingleSimReportState,
  simulations: [
    {
      ...mockSingleSimReportState.simulations[0],
      policy: { id: TEST_POLICY_IDS.CURRENT_LAW, label: 'Current law', parameters: [] },
    },
  ],
};

export const mockIdenticalPolicyReportState: ReportBuilderState = {
  ...mockTwoSimReportState,
  simulations: mockTwoSimReportState.simulations.map((simulation, index) => ({
    ...simulation,
    policy: {
      id: index === 0 ? TEST_POLICY_IDS.REFORM_POLICY : TEST_POLICY_IDS.SECOND_REFORM_POLICY,
      label: `Equivalent reform ${index + 1}`,
      parameters: structuredClone(REPORT_EFFECTIVE_PARAMETERS),
    },
  })),
};

// Store helpers
export function createTestStore(currentLawId: number = CURRENT_LAW_ID) {
  return configureStore({
    reducer: { metadata: metadataReducer },
    preloadedState: {
      metadata: {
        currentCountry: 'us',
        loading: false,
        error: null,
        variables: {},
        parameters: REPORT_CURRENT_LAW_METADATA,
        entities: {},
        variableModules: {},
        economyOptions: { region: [], time_period: [], datasets: [] },
        currentLawId,
        basicInputs: [],
        modelledPolicies: { core: {}, filtered: {} },
        version: 'test-version',
        parameterTree: null,
      },
    },
  } as any);
}

// Mock functions
export const mockCreateSimulationFn = vi.fn();
export const mockLocalStorageCreateFn = vi.fn();
export const mockCreateReportFn = vi.fn();
export const mockOnSuccess = vi.fn();

export function setupDefaultMocks() {
  mockCreateSimulationFn.mockReset();
  mockLocalStorageCreateFn.mockReset();
  mockCreateReportFn.mockReset();
  mockOnSuccess.mockReset();

  // Default: createSimulation returns incrementing IDs
  let callCount = 0;
  mockCreateSimulationFn.mockImplementation(() => {
    callCount++;
    return Promise.resolve(
      mockCreateSimulationResponse(
        callCount === 1 ? TEST_SIMULATION_IDS.SIM_NEW_1 : TEST_SIMULATION_IDS.SIM_NEW_2
      )
    );
  });

  mockLocalStorageCreateFn.mockResolvedValue({
    id: 'sus-test',
    userId: 'anonymous',
    simulationId: TEST_SIMULATION_IDS.SIM_NEW_1,
    countryId: 'us',
    isCreated: true,
  });

  mockCreateReportFn.mockImplementation((_args: any, callbacks: any) => {
    callbacks?.onSuccess?.({ userReport: { id: 'user-report-new' } });
    return Promise.resolve();
  });
}

export const CORRECTED_REPORT_YEAR = '2023';
export function mockDraftHouseholdSimulation(countryId: 'us' | 'uk' = 'us') {
  return {
    ...mockSingleSimReportState.simulations[0],
    countryId,
    population: {
      label: TEST_LABELS.BASELINE,
      type: 'household' as const,
      household: Household.starter(countryId, CORRECTED_REPORT_YEAR),
      householdNeedsCreation: true,
      geography: null,
    },
  };
}

export function mixedPopulationReportState(
  householdFirst: boolean,
  source: 'draft' | 'hydrated' = 'draft'
): ReportBuilderState {
  if (source === 'hydrated') {
    const data = ownershipHydrationData('mixed-population-report');
    const geography = mockTwoSimReportState.simulations[0].population.geography!;
    const simulations: Simulation[] = data.simulations.map((simulation, index) =>
      index === (householdFirst ? 1 : 0)
        ? { ...simulation, populationId: geography.geographyId, populationType: 'geography' }
        : simulation
    );
    return hydrateReportBuilderState({
      ...data,
      simulations,
      geographies: [geography],
      currentLawId: CURRENT_LAW_ID,
    });
  }
  const householdSimulation = {
    ...mockDraftHouseholdSimulation(),
    policy: { id: TEST_POLICY_IDS.CURRENT_LAW, label: 'Current law', parameters: [] },
  };
  const geographySimulation = mockTwoSimReportState.simulations[1];
  return {
    ...mockTwoSimReportState,
    year: CORRECTED_REPORT_YEAR,
    simulations: householdFirst
      ? [householdSimulation, geographySimulation]
      : [geographySimulation, householdSimulation],
  };
}
