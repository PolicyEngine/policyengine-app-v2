import { Simulation } from '@/types/ingredients/Simulation';

// Test IDs (only for simulations that have been created via API)
export const TEST_PERMANENT_ID_1 = 'sim-123';
export const TEST_PERMANENT_ID_2 = 'sim-456';

// Test population and policy IDs
export const TEST_HOUSEHOLD_ID = 'household-789';
export const TEST_GEOGRAPHY_ID = 'geo-101';
export const TEST_POLICY_ID_1 = 'policy-111';
export const TEST_POLICY_ID_2 = 'policy-222';

// Test labels
export const TEST_LABEL_1 = 'Test Simulation 1';
export const TEST_LABEL_2 = 'Test Simulation 2';
export const TEST_LABEL_UPDATED = 'Updated Simulation';

// Mock simulations
export const mockSimulation1: Simulation = {
  id: TEST_PERMANENT_ID_1,
  populationId: TEST_HOUSEHOLD_ID,
  populationType: 'household',
  policyId: TEST_POLICY_ID_1,
  label: TEST_LABEL_1,
  isCreated: true,
};

export const mockSimulation2: Simulation = {
  id: TEST_PERMANENT_ID_2,
  populationId: TEST_GEOGRAPHY_ID,
  populationType: 'geography',
  policyId: TEST_POLICY_ID_2,
  label: TEST_LABEL_2,
  isCreated: false,
};

export const mockEmptySimulation: Simulation = {
  populationId: undefined,
  policyId: undefined,
  populationType: undefined,
  label: null,
  id: undefined,
  isCreated: false,
};

// Mock simulations without IDs (not yet created via API)
export const mockSimulationWithoutId1: Simulation = {
  id: undefined,
  populationId: TEST_HOUSEHOLD_ID,
  populationType: 'household',
  policyId: TEST_POLICY_ID_1,
  label: TEST_LABEL_1,
  isCreated: false,
};

export const mockSimulationWithoutId2: Simulation = {
  id: undefined,
  populationId: TEST_GEOGRAPHY_ID,
  populationType: 'geography',
  policyId: TEST_POLICY_ID_2,
  label: TEST_LABEL_2,
  isCreated: false,
};

// Initial state configurations - position-based storage
export const emptyInitialState = {
  simulations: [null, null] as [Simulation | null, Simulation | null],
};

export const singleSimulationState = {
  simulations: [mockSimulationWithoutId1, null] as [Simulation | null, Simulation | null],
};

export const multipleSimulationsState = {
  simulations: [mockSimulation1, mockSimulation2] as [Simulation | null, Simulation | null],
};

export const bothSimulationsWithoutIdState = {
  simulations: [mockSimulationWithoutId1, mockSimulationWithoutId2] as [Simulation | null, Simulation | null],
};
