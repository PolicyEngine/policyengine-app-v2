import { vi } from 'vitest';
import { Household } from '@/types/ingredients/Household';
import { Policy } from '@/types/ingredients/Policy';
import { Simulation } from '@/types/ingredients/Simulation';
import { UserPolicy } from '@/types/ingredients/UserPolicy';
import { UserHouseholdPopulation } from '@/types/ingredients/UserPopulation';
import { UserSimulation } from '@/types/ingredients/UserSimulation';
import { MetadataState } from '@/types/metadata';
import { HouseholdMetadata } from '@/types/metadata/householdMetadata';
import { PolicyMetadata } from '@/types/metadata/policyMetadata';
import { SimulationMetadata } from '@/types/metadata/simulationMetadata';
import { mockReport } from '../adapters/reportMocks';
import { TEST_USER_ID } from '../api/reportAssociationMocks';

// Test ID constants
export const TEST_SIMULATION_ID_1 = 'sim-456';
export const TEST_SIMULATION_ID_2 = 'sim-789';
export const TEST_POLICY_ID_1 = 'policy-456'; // Changed to avoid ID collision with simulations
export const TEST_POLICY_ID_2 = 'policy-789'; // Changed to avoid ID collision with simulations
export const TEST_HOUSEHOLD_ID = 'household-123';
export const TEST_GEOGRAPHY_ID = 'california';
export const TEST_COUNTRIES = {
  US: 'us',
  UK: 'uk',
  CA: 'ca',
} as const;

// Mock Simulation entities
export const mockSimulation1: Simulation = {
  id: TEST_SIMULATION_ID_1,
  countryId: TEST_COUNTRIES.US,
  policyId: TEST_POLICY_ID_1, // policy-456
  populationId: TEST_HOUSEHOLD_ID,
  populationType: 'household',
  apiVersion: 'v1',
  label: 'Test Simulation 1',
  isCreated: true,
};

export const mockSimulation2: Simulation = {
  id: TEST_SIMULATION_ID_2,
  countryId: TEST_COUNTRIES.US,
  policyId: TEST_POLICY_ID_2, // policy-789
  populationId: TEST_GEOGRAPHY_ID,
  populationType: 'geography',
  apiVersion: 'v1',
  label: 'Test Simulation 2',
  isCreated: true,
};

// Mock Policy entities (matching PolicyAdapter.fromMetadata structure)
export const mockPolicy1: Policy = {
  id: TEST_POLICY_ID_1,
  countryId: TEST_COUNTRIES.US,
  apiVersion: 'v1',
  parameters: [],
};

export const mockPolicy2: Policy = {
  id: TEST_POLICY_ID_2,
  countryId: TEST_COUNTRIES.US,
  apiVersion: 'v1',
  parameters: [],
};

// Mock Household entity
export const mockHousehold1: Household = {
  id: TEST_HOUSEHOLD_ID,
  countryId: TEST_COUNTRIES.US,
  householdData: {
    people: {},
    families: {},
    tax_units: {},
    spm_units: {},
    households: {},
    marital_units: {},
  },
};

// Mock User Associations
export const mockUserSimulations: UserSimulation[] = [
  {
    id: 'user-sim-1',
    userId: TEST_USER_ID,
    simulationId: TEST_SIMULATION_ID_1,
    label: 'My Simulation 1',
    createdAt: '2025-01-01T10:00:00Z',
  },
  {
    id: 'user-sim-2',
    userId: TEST_USER_ID,
    simulationId: TEST_SIMULATION_ID_2,
    label: 'My Simulation 2',
    createdAt: '2025-01-02T10:00:00Z',
  },
];

export const mockUserPolicies: UserPolicy[] = [
  {
    id: 'user-pol-1',
    userId: TEST_USER_ID,
    policyId: TEST_POLICY_ID_1,
    label: 'My Policy 1',
    createdAt: '2025-01-01T09:00:00Z',
  },
  {
    id: 'user-pol-2',
    userId: TEST_USER_ID,
    policyId: TEST_POLICY_ID_2,
    label: 'My Policy 2',
    createdAt: '2025-01-02T09:00:00Z',
  },
];

export const mockUserHouseholds: UserHouseholdPopulation[] = [
  {
    id: 'user-hh-1',
    userId: TEST_USER_ID,
    householdId: TEST_HOUSEHOLD_ID,
    label: 'My Household',
    type: 'household',
    createdAt: '2025-01-01T08:00:00Z',
  },
];

// Mock API Metadata responses
export const mockSimulationMetadata1: SimulationMetadata = {
  id: parseInt(TEST_SIMULATION_ID_1.replace('sim-', ''), 10),
  country_id: TEST_COUNTRIES.US,
  api_version: 'v1',
  population_id: TEST_HOUSEHOLD_ID,
  population_type: 'household' as const,
  policy_id: TEST_POLICY_ID_1, // policy-456
};

export const mockSimulationMetadata2: SimulationMetadata = {
  id: parseInt(TEST_SIMULATION_ID_2.replace('sim-', ''), 10),
  country_id: TEST_COUNTRIES.US,
  api_version: 'v1',
  population_id: TEST_GEOGRAPHY_ID,
  population_type: 'geography' as const,
  policy_id: TEST_POLICY_ID_2, // policy-789
};

export const mockPolicyMetadata1: PolicyMetadata = {
  id: TEST_POLICY_ID_1,
  country_id: TEST_COUNTRIES.US,
  api_version: 'v1',
  policy_json: {},
  policy_hash: 'hash-456',
  label: 'Test Policy 1',
};

export const mockPolicyMetadata2: PolicyMetadata = {
  id: TEST_POLICY_ID_2,
  country_id: TEST_COUNTRIES.US,
  api_version: 'v1',
  policy_json: {},
  policy_hash: 'hash-789',
  label: 'Test Policy 2',
};

export const mockHouseholdMetadata: HouseholdMetadata = {
  id: TEST_HOUSEHOLD_ID,
  country_id: TEST_COUNTRIES.US,
  api_version: 'v1',
  household_json: {
    people: {},
    families: {},
    tax_units: {},
    spm_units: {},
    households: {},
    marital_units: {},
  },
  household_hash: 'hash-household-123',
  label: 'Test Household',
};

// Mock Redux store initial state
export const mockMetadataInitialState = {
  metadata: {
    currentCountry: TEST_COUNTRIES.US,
    loading: false,
    error: null,
    variables: {},
    parameters: {},
    entities: {},
    variableModules: {},
    economyOptions: {
      region: [
        { name: 'california', label: 'California' },
        { name: 'texas', label: 'Texas' },
      ],
      time_period: [],
      datasets: [],
    },
    currentLawId: 0,
    basicInputs: [],
    modelledPolicies: { core: {}, filtered: {} },
    version: 'v1.0.0',
    parameterTree: null,
  } satisfies MetadataState,
};

// Helper function to create normalized cache mock
export const createNormalizedCacheMock = () => ({
  getObjectById: vi.fn((id: string) => {
    // Return mocked normalized data based on ID
    if (id === mockReport.id || id === '123') {
      return mockReport;
    }
    if (id === 'report-1' || id === '1') {
      return {
        ...mockReport,
        id: '1',
        simulationIds: ['456', '789'],
      };
    }
    if (id === 'report-2' || id === '2') {
      return {
        ...mockReport,
        id: '2',
        simulationIds: ['456'],
      };
    }
    // Check policies first (before simulations)
    if (id === TEST_POLICY_ID_1 || id === 'policy-456') {
      return mockPolicy1;
    }
    if (id === TEST_POLICY_ID_2 || id === 'policy-789') {
      return mockPolicy2;
    }
    // Then check simulations
    if (id === TEST_SIMULATION_ID_1 || id === '456') {
      // Return simulation with adapted ID format (string number) to match SimulationAdapter output
      return {
        ...mockSimulation1,
        id: '456', // Override to match adapted format
      };
    }
    if (id === TEST_SIMULATION_ID_2 || id === '789') {
      // Return simulation with adapted ID format (string number) to match SimulationAdapter output
      return {
        ...mockSimulation2,
        id: '789', // Override to match adapted format
      };
    }
    if (id === TEST_HOUSEHOLD_ID || id === 'household-123') {
      return mockHousehold1;
    }
    return undefined;
  }),
});

// Error messages
export const ERROR_MESSAGES = {
  REPORT_NOT_FOUND: (id: string) => `Report ${id} not found`,
  SIMULATION_NOT_FOUND: (id: string) => `Simulation ${id} not found`,
  POLICY_NOT_FOUND: (id: string) => `Policy ${id} not found`,
  HOUSEHOLD_NOT_FOUND: (id: string) => `Household ${id} not found`,
  FETCH_ASSOCIATIONS_FAILED: 'Failed to fetch report associations',
  SIMULATION_FETCH_FAILED: 'Simulation fetch failed',
  POLICY_FETCH_FAILED: 'Policy fetch failed',
} as const;
