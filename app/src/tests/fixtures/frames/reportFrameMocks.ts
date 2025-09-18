import { vi } from 'vitest';
import { Simulation } from '@/types/ingredients/Simulation';

// Mock simulations for testing
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
  isCreated: true,
};

export const mockSimulationUnconfigured: Simulation = {
  countryId: 'us',
  label: null,
  isCreated: false,
};

// Mock navigation function
export const mockOnNavigate = vi.fn();

// Helper to create mock Redux state for report frames
export const createMockReportState = (overrides?: {
  mode?: 'standalone' | 'report';
  activeSimulationPosition?: 0 | 1;
  simulations?: [Simulation | null, Simulation | null];
}) => {
  const {
    mode = 'standalone',
    activeSimulationPosition = 0,
    simulations = [null, null],
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
      simulations,
    },
    policy: {
      policies: [null, null],
    },
    population: {
      populations: [null, null],
    },
    household: {
      populations: [null, null],
    },
    flow: {},
    metadata: {},
  };
};