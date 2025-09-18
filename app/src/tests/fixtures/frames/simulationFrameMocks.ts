import { vi } from 'vitest';
import { Simulation } from '@/types/ingredients/Simulation';
import { Policy } from '@/types/ingredients/Policy';
import { Population } from '@/types/ingredients/Population';

// Mock simulations
export const mockSimulation: Simulation = {
  id: 'sim-123',
  countryId: 'us',
  apiVersion: '1.0.0',
  policyId: 'policy-123',
  populationId: 'household-123',
  populationType: 'household',
  label: 'Test Simulation',
  isCreated: true,
};

export const mockSimulationWithoutPolicy: Simulation = {
  countryId: 'us',
  populationId: 'household-123',
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
  id: 'policy-123',
  label: 'Test Policy',
  isCreated: true,
  parameters: [],
};

// Mock population (old structure - to be migrated)
export const mockPopulationOld = {
  label: 'Test Population',
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

// Mock navigation function
export const mockOnNavigate = vi.fn();

// Mock dispatch
export const mockDispatch = vi.fn();

// Helper to create mock state for simulation frames
export const createMockSimulationState = (overrides?: {
  mode?: 'standalone' | 'report';
  activeSimulationPosition?: 0 | 1;
  simulation?: Simulation | null;
  policy?: any; // Old structure
  population?: any; // Old structure
}) => {
  const {
    mode = 'standalone',
    activeSimulationPosition = 0,
    simulation = null,
    policy = {},
    population = {},
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