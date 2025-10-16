import { vi } from 'vitest';
import { RootState } from '@/store';

// Test constants
export const TEST_CURRENT_LAW_IDS = {
  US: 2,
  UK: 1,
} as const;

export const TEST_COUNTRIES = {
  US: 'us',
  UK: 'uk',
} as const;

// Mock navigation function
export const mockOnNavigate = vi.fn();

// Mock dispatch function
export const mockDispatch = vi.fn();

// Helper to create mock Redux state for SimulationSetupPolicyFrame
export const createMockSimulationSetupPolicyState = (overrides?: {
  countryId?: string;
  currentLawId?: number;
  mode?: 'standalone' | 'report';
  activeSimulationPosition?: 0 | 1;
}): Partial<RootState> => {
  const {
    countryId = TEST_COUNTRIES.US,
    currentLawId = TEST_CURRENT_LAW_IDS.US,
    mode = 'standalone',
    activeSimulationPosition = 0,
  } = overrides || {};

  return {
    metadata: {
      currentCountry: countryId,
      loading: false,
      error: null,
      variables: {},
      parameters: {},
      entities: {},
      variableModules: {},
      economyOptions: { region: [], time_period: [], datasets: [] },
      currentLawId,
      basicInputs: [],
      modelledPolicies: { core: {}, filtered: {} },
      version: '1.0.0',
      parameterTree: null,
    },
    report: {
      reportId: undefined,
      label: null,
      countryId: countryId as any,
      apiVersion: null,
      simulationIds: [],
      status: 'pending',
      output: null,
      createdAt: null,
      updatedAt: null,
      activeSimulationPosition,
      mode,
    },
    policy: {
      policies: [null, null],
    },
  };
};

// Expected policy payloads for current law
export const expectedCurrentLawPolicyUS = {
  id: TEST_CURRENT_LAW_IDS.US.toString(),
  label: 'Current law',
  parameters: [],
  isCreated: true,
  countryId: TEST_COUNTRIES.US,
};

export const expectedCurrentLawPolicyUK = {
  id: TEST_CURRENT_LAW_IDS.UK.toString(),
  label: 'Current law',
  parameters: [],
  isCreated: true,
  countryId: TEST_COUNTRIES.UK,
};
