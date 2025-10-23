import type { SimulationMetadata } from '@/types/metadata/simulationMetadata';
import type { Simulation } from '@/types/ingredients/Simulation';

export const TEST_SIMULATION_IDS = {
  SIM_123: 123,
  SIM_456: 456,
  SIM_789: 789,
} as const;

export const TEST_POLICY_IDS = {
  POLICY_1: '1',
  POLICY_2: '2',
} as const;

export const TEST_POPULATION_IDS = {
  HOUSEHOLD_1: 'household-1',
  GEOGRAPHY_US: 'us',
} as const;

export const TEST_COUNTRIES = {
  US: 'us',
  UK: 'uk',
} as const;

export const mockSimulationMetadata = (overrides?: Partial<SimulationMetadata>): SimulationMetadata => ({
  id: TEST_SIMULATION_IDS.SIM_123,
  country_id: TEST_COUNTRIES.US,
  api_version: '1.0.0',
  policy_id: TEST_POLICY_IDS.POLICY_1,
  population_id: TEST_POPULATION_IDS.HOUSEHOLD_1,
  population_type: 'household',
  status: 'complete',
  output: { household_net_income: { 2024: 50000 } },
  ...overrides,
});

export const mockSimulationMetadataGeography = (): SimulationMetadata => ({
  id: TEST_SIMULATION_IDS.SIM_456,
  country_id: TEST_COUNTRIES.US,
  api_version: '1.0.0',
  policy_id: TEST_POLICY_IDS.POLICY_2,
  population_id: TEST_POPULATION_IDS.GEOGRAPHY_US,
  population_type: 'geography',
  status: 'pending',
  output: null,
});

export const mockSimulationMetadataStringifiedOutput = (): SimulationMetadata => ({
  id: TEST_SIMULATION_IDS.SIM_789,
  country_id: TEST_COUNTRIES.UK,
  api_version: '1.0.0',
  policy_id: TEST_POLICY_IDS.POLICY_1,
  population_id: TEST_POPULATION_IDS.HOUSEHOLD_1,
  population_type: 'household',
  status: 'complete',
  output: '{"household_net_income":{"2024":60000}}' as any,
});

export const mockSimulation = (overrides?: Partial<Simulation>): Simulation => ({
  id: String(TEST_SIMULATION_IDS.SIM_123),
  countryId: TEST_COUNTRIES.US,
  apiVersion: '1.0.0',
  policyId: TEST_POLICY_IDS.POLICY_1,
  populationId: TEST_POPULATION_IDS.HOUSEHOLD_1,
  populationType: 'household',
  label: null,
  isCreated: true,
  output: { household_net_income: { 2024: 50000 } },
  status: 'complete',
  ...overrides,
});

export const mockSimulationOutput = () => ({
  household_net_income: { 2024: 50000 },
  household_benefits: { 2024: 10000 },
});

export const mockErrorMessage = () => 'Calculation failed due to invalid parameters';
