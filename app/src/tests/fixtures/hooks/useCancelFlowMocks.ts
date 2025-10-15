import { vi } from 'vitest';

// Test constants
export const TEST_COUNTRIES = {
  US: 'us',
  UK: 'uk',
} as const;

export const TEST_POSITIONS = {
  FIRST: 0,
  SECOND: 1,
} as const;

export const TEST_INGREDIENT_TYPES = {
  POLICY: 'policy',
  POPULATION: 'population',
  SIMULATION: 'simulation',
  REPORT: 'report',
} as const;

export const TEST_MODES = {
  STANDALONE: 'standalone',
  REPORT: 'report',
} as const;

// Mock store state builders
export const createMockFlowState = (flowStackLength: number = 0) => ({
  currentFlow: null,
  currentFrame: null,
  flowStack: Array.from({ length: flowStackLength }, () => ({
    flow: {},
    frame: 'testFrame',
  })),
});

export const createMockReportState = (
  position: 0 | 1 = 0,
  mode: 'standalone' | 'report' = 'standalone'
) => ({
  id: '',
  label: null,
  countryId: TEST_COUNTRIES.US,
  simulationIds: [],
  apiVersion: null,
  status: 'pending' as const,
  output: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  activeSimulationPosition: position,
  mode,
});

export const createMockMetadataState = (countryId: string = TEST_COUNTRIES.US) => ({
  currentCountry: countryId,
  variables: {},
  parameters: {},
  entities: {},
  variableModules: {},
  economyOptions: { region: [], time_period: [], datasets: [] },
  currentLawId: 0,
  basicInputs: [],
  modelledPolicies: { core: {}, filtered: {} },
  version: null,
  parameterTree: null,
  loading: false,
  error: null,
});

export const createMockRootState = (
  flowStackLength: number = 0,
  currentPosition: 0 | 1 = 0,
  countryId: string = TEST_COUNTRIES.US
) => ({
  flow: createMockFlowState(flowStackLength),
  report: createMockReportState(
    currentPosition,
    currentPosition === 1 ? 'report' : 'standalone' // Set mode to 'report' when position is 1
  ),
  metadata: createMockMetadataState(countryId),
  simulations: { simulations: [null, null] },
  policy: { policies: [null, null] },
  population: { populations: [null, null] },
});

// Mock functions
export const createMockNavigate = () => vi.fn();
export const createMockDispatch = () => vi.fn();
export const createMockHandleCancel = () => vi.fn();

// Mock useIngredientReset return value
export const createMockUseIngredientReset = () => ({
  resetIngredient: vi.fn(),
  resetIngredients: vi.fn(),
});

// Expected navigation paths
export const EXPECTED_NAVIGATION_PATHS = {
  POLICIES: (countryId: string) => `/${countryId}/policies`,
  POPULATIONS: (countryId: string) => `/${countryId}/populations`,
  SIMULATIONS: (countryId: string) => `/${countryId}/simulations`,
  REPORTS: (countryId: string) => `/${countryId}/reports`,
} as const;
