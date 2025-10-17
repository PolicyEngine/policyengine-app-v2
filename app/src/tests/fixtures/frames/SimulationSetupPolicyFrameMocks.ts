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

// Button order constants for testing
export const BUTTON_ORDER = {
  CURRENT_LAW: 0,
  LOAD_EXISTING: 1,
  CREATE_NEW: 2,
} as const;

export const BUTTON_TEXT = {
  CURRENT_LAW: {
    title: 'Current Law',
    description: 'Use the baseline tax-benefit system with no reforms',
  },
  LOAD_EXISTING: {
    title: 'Load Existing Policy',
    description: 'Use a policy you have already created',
  },
  CREATE_NEW: {
    title: 'Create New Policy',
    description: 'Build a new policy',
  },
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
      id: '',
      label: null,
      countryId: countryId as any,
      apiVersion: null,
      simulationIds: [],
      status: 'pending',
      output: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
