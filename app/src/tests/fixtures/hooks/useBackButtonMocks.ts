import { vi } from 'vitest';
import { ComponentKey } from '@/flows/registry';

// Test constants for frame names
export const TEST_FRAME_NAMES = {
  FRAME_A: 'frameA' as ComponentKey,
  FRAME_B: 'frameB' as ComponentKey,
  FRAME_C: 'frameC' as ComponentKey,
} as const;

// Mock dispatch function
export const createMockDispatch = () => vi.fn();

// Mock state creators
export const createMockFlowState = (frameHistory: ComponentKey[] = []) => ({
  currentFlow: null,
  currentFrame: TEST_FRAME_NAMES.FRAME_A,
  flowStack: [],
  frameHistory,
});

export const createMockRootState = (frameHistory: ComponentKey[] = []) => ({
  flow: createMockFlowState(frameHistory),
  report: {
    id: '',
    label: null,
    countryId: 'us',
    simulationIds: [],
    apiVersion: null,
    status: 'pending' as const,
    output: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    activeSimulationPosition: 0,
    mode: 'standalone' as const,
  },
  metadata: {
    currentCountry: 'us',
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
  },
  simulations: { simulations: [null, null] },
  policy: { policies: [null, null] },
  population: { populations: [null, null] },
});

// State scenarios
export const MOCK_STATE_WITH_NO_HISTORY = createMockRootState([]);

export const MOCK_STATE_WITH_SINGLE_HISTORY = createMockRootState([TEST_FRAME_NAMES.FRAME_A]);

export const MOCK_STATE_WITH_MULTIPLE_HISTORY = createMockRootState([
  TEST_FRAME_NAMES.FRAME_A,
  TEST_FRAME_NAMES.FRAME_B,
]);
