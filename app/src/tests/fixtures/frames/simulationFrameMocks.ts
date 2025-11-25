import { vi } from 'vitest';
import { Simulation } from '@/types/ingredients/Simulation';

// Mock simulations
export const mockSimulation: Simulation = {
  id: '123',
  countryId: 'us',
  apiVersion: '1.0.0',
  policyId: '123',
  populationId: '123',
  populationType: 'household',
  label: 'Test Simulation',
  isCreated: true,
};

export const mockSimulationWithoutPolicy: Simulation = {
  countryId: 'us',
  populationId: '123',
  populationType: 'household',
  label: 'Partial Simulation',
  isCreated: false,
};

export const mockSimulationEmpty: Simulation = {
  countryId: 'us',
  label: null,
  isCreated: false,
};

// Mock policy (old structure - to be migrated)
export const mockPolicyOld = {
  id: '123',
  label: 'Test Policy',
  isCreated: true,
  parameters: [],
};

// Mock population (old structure - to be migrated)
export const mockPopulationOld = {
  label: 'Test Population',
  isCreated: true,
  household: {
    id: '123',
    countryId: 'us',
    householdData: {
      people: {},
    },
  },
  geography: null,
};

// Mock navigation function
export const mockOnNavigate = vi.fn();

// Mock dispatch
export const mockDispatch = vi.fn();

// Helper to create mock state for simulation frames
export const createMockSimulationState = (overrides?: {
  mode?: 'standalone' | 'report';
  activeSimulationPosition?: 0 | 1;
  reportLabel?: string | null;
  simulation?: Simulation | null;
  policy?: any; // Old structure
  population?: any; // Old structure
}) => {
  const {
    mode = 'standalone',
    activeSimulationPosition = 0,
    reportLabel = null,
    simulation = null,
    policy = {},
    population = {},
  } = overrides || {};

  return {
    report: {
      reportId: undefined,
      label: reportLabel,
      countryId: 'us',
      apiVersion: null,
      simulationIds: [],
      status: 'pending',
      output: null,
      createdAt: null,
      updatedAt: null,
      activeSimulationPosition,
      mode,
    },
    simulations: {
      simulations: [simulation, null],
    },
    policy,
    population,
  };
};

// Mock report states for auto-naming tests
export const mockReportStateStandalone = {
  id: '',
  label: null,
  countryId: 'us' as const,
  apiVersion: null,
  simulationIds: [],
  status: 'pending' as const,
  output: null,
  mode: 'standalone' as const,
  activeSimulationPosition: 0 as const,
};

export const mockReportStateReportWithName = {
  id: '456',
  label: '2025 Tax Analysis',
  countryId: 'us' as const,
  apiVersion: null,
  simulationIds: [],
  status: 'pending' as const,
  output: null,
  mode: 'report' as const,
  activeSimulationPosition: 0 as const,
};

export const mockReportStateReportWithoutName = {
  id: '789',
  label: null,
  countryId: 'us' as const,
  apiVersion: null,
  simulationIds: [],
  status: 'pending' as const,
  output: null,
  mode: 'report' as const,
  activeSimulationPosition: 0 as const,
};
