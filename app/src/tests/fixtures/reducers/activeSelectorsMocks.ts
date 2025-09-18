import { RootState } from '@/store';
import { Simulation } from '@/types/ingredients/Simulation';
import { Policy } from '@/types/ingredients/Policy';
import { Population } from '@/types/ingredients/Population';

// Mock simulations
export const mockSimulation1: Simulation = {
  id: 'sim-123',
  countryId: 'us',
  apiVersion: '1.0.0',
  policyId: 'policy-123',
  populationId: 'household-123',
  populationType: 'household',
  label: 'Baseline Simulation',
  isCreated: true,
};

export const mockSimulation2: Simulation = {
  id: 'sim-456',
  countryId: 'uk',
  apiVersion: '1.0.0',
  policyId: 'policy-456',
  populationId: 'geo-456',
  populationType: 'geography',
  label: 'Reform Simulation',
  isCreated: false,
};

// Mock policies
export const mockPolicy1: Policy = {
  id: 'policy-123',
  label: 'Baseline Policy',
  parameters: [],
  isCreated: true,
};

export const mockPolicy2: Policy = {
  id: 'policy-456',
  label: 'Reform Policy',
  parameters: [],
  isCreated: false,
};

// Mock populations
export const mockPopulation1: Population = {
  label: 'Baseline Population',
  isCreated: true,
  household: {
    id: 'household-123',
    countryId: 'us',
    householdData: {
      people: {},
    },
  },
  geography: null,
};

export const mockPopulation2: Population = {
  label: 'Reform Population',
  isCreated: false,
  household: null,
  geography: {
    id: 'geo-456',
    countryId: 'uk',
    scope: 'national',
    geographyId: 'uk',
  },
};

// Helper function to create a mock RootState
export const createMockRootState = (overrides?: {
  reportMode?: 'standalone' | 'report';
  activePosition?: 0 | 1;
  simulations?: [Simulation | null, Simulation | null];
  policies?: [Policy | null, Policy | null];
  populations?: [Population | null, Population | null];
}): RootState => {
  const {
    reportMode = 'standalone',
    activePosition = 0,
    simulations = [mockSimulation1, mockSimulation2],
    policies = [mockPolicy1, mockPolicy2],
    populations = [mockPopulation1, mockPopulation2],
  } = overrides || {};

  return {
    report: {
      reportId: undefined,
      label: null,
      countryId: 'us',
      apiVersion: null,
      simulationIds: [],
      status: 'pending',
      output: null,
      createdAt: null,
      updatedAt: null,
      activeSimulationPosition: activePosition,
      mode: reportMode,
    },
    simulations: {
      simulations,
    },
    policy: {
      policies,
    },
    population: {
      populations,
    },
  } as unknown as RootState;
};

// Common test scenarios
export const STANDALONE_MODE_STATE = createMockRootState({
  reportMode: 'standalone',
  activePosition: 1, // Should be ignored in standalone mode
});

export const REPORT_MODE_POSITION_0_STATE = createMockRootState({
  reportMode: 'report',
  activePosition: 0,
});

export const REPORT_MODE_POSITION_1_STATE = createMockRootState({
  reportMode: 'report',
  activePosition: 1,
});

export const STATE_WITH_NULL_AT_POSITION = createMockRootState({
  reportMode: 'report',
  activePosition: 0,
  simulations: [null, mockSimulation2],
  policies: [null, mockPolicy2],
  populations: [null, mockPopulation2],
});

export const STATE_WITH_ALL_NULL = createMockRootState({
  simulations: [null, null],
  policies: [null, null],
  populations: [null, null],
});