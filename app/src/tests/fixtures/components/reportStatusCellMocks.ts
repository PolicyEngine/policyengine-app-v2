import type { Report } from '@/types/ingredients/Report';
import type { Simulation } from '@/types/ingredients/Simulation';

// Test constants for status cell components
export const TEST_REPORT_ID = '123';
export const TEST_SIMULATION_IDS = ['sim-1', 'sim-2'];

// Report statuses (matching Report type)
export const REPORT_STATUS = {
  PENDING: 'pending',
  COMPLETE: 'complete',
  ERROR: 'error',
} as const;

// Formatted status texts (capitalized)
export const FORMATTED_STATUS = {
  INITIALIZING: 'Initializing',
  PENDING: 'Pending',
  COMPLETE: 'Complete',
  ERROR: 'Error',
} as const;

// Calculation progress percentages
export const PROGRESS = {
  ZERO: 0,
  HALF: 50,
  ALMOST_DONE: 95,
  COMPLETE: 100,
} as const;

// Mock report objects
export const mockPendingReport: Report = {
  id: TEST_REPORT_ID,
  countryId: 'us',
  apiVersion: null,
  simulationIds: [],
  status: 'pending',
  output: null,
};

export const mockCompleteReport: Report = {
  id: TEST_REPORT_ID,
  countryId: 'us',
  apiVersion: null,
  simulationIds: [],
  status: 'complete',
  output: {} as any,
};

export const mockErrorReport: Report = {
  id: TEST_REPORT_ID,
  countryId: 'us',
  apiVersion: null,
  simulationIds: [],
  status: 'error',
  output: null,
};

// Mock simulation objects
export const mockSimulationWithOutput: Simulation = {
  id: 'sim-1',
  label: 'Test Simulation 1',
  policyId: 'policy-1',
  populationId: 'pop-1',
  populationType: 'household',
  isCreated: true,
  output: {} as any,
};

export const mockSimulationWithoutOutput: Simulation = {
  id: 'sim-2',
  label: 'Test Simulation 2',
  policyId: 'policy-2',
  populationId: 'pop-2',
  populationType: 'household',
  isCreated: true,
  output: null,
};

// Mock calculation status hook returns
export const mockCalculationInProgress = {
  isCalculating: true,
  progress: PROGRESS.HALF,
};

export const mockCalculationComplete = {
  isCalculating: false,
  progress: PROGRESS.COMPLETE,
};

export const mockCalculationNotStarted = {
  isCalculating: false,
  progress: PROGRESS.ZERO,
};
