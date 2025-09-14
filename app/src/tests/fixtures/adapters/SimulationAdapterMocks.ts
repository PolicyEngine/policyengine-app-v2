import { Simulation } from '@/types/ingredients/Simulation';
import { SimulationMetadata } from '@/types/metadata/simulationMetadata';
import { SimulationCreationPayload } from '@/types/payloads';
import {
  EXISTING_SIMULATION_ID,
  TEST_COUNTRIES,
  TEST_HOUSEHOLD_ID,
  TEST_POLICY_ID,
} from '../api/simulationMocks';

// Mock simulation metadata (API response format)
export const mockSimulationMetadataComplete: SimulationMetadata = {
  id: 123,  // Changed from simulation_id string to id number
  country_id: TEST_COUNTRIES.US,
  api_version: '1.0.0',
  policy_id: 456,  // Changed from string to number
  population_id: TEST_HOUSEHOLD_ID,
  population_type: 'household',
};

export const mockSimulationMetadataWithGeography: SimulationMetadata = {
  id: 789,  // Changed from simulation_id string to id number
  country_id: TEST_COUNTRIES.UK,
  api_version: '2.0.0',
  policy_id: 101,  // Changed from null to number (backend won't accept null policy_id)
  population_id: 'geography-789',
  population_type: 'geography',
};

export const mockSimulationMetadataMinimal: SimulationMetadata = {
  id: 112,  // Changed from simulation_id string to id number
  country_id: TEST_COUNTRIES.CA,
  api_version: '1.0.0',
  policy_id: 113,  // Changed from null to number (backend won't accept null policy_id)
  population_id: 'household-minimal',
  population_type: 'household',
};

// Mock simulation metadata with missing required fields
export const mockSimulationMetadataMissingPopulation: Partial<SimulationMetadata> = {
  id: 999,  // Changed from simulation_id string to id number
  country_id: TEST_COUNTRIES.US,
  api_version: '1.0.0',
  policy_id: Number(TEST_POLICY_ID),
  // population_id and population_type missing
};

export const mockSimulationMetadataMissingPopulationType: Partial<SimulationMetadata> = {
  id: 998,  // Changed from simulation_id string to id number
  country_id: TEST_COUNTRIES.US,
  api_version: '1.0.0',
  policy_id: 456,  // Changed to number
  population_id: TEST_HOUSEHOLD_ID,
  // population_type missing
};

// Mock simulation objects (frontend format - after conversion)
export const mockSimulationComplete: Simulation = {
  id: '123',  // String version of metadata.id
  countryId: TEST_COUNTRIES.US,
  apiVersion: '1.0.0',
  policyId: '456',  // String version of metadata.policy_id
  populationId: TEST_HOUSEHOLD_ID,
  populationType: 'household',
};

export const mockSimulationWithGeography: Simulation = {
  id: '789',  // String version of metadata.id
  countryId: TEST_COUNTRIES.UK,
  apiVersion: '2.0.0',
  policyId: '101',  // String version of metadata.policy_id
  populationId: 'geography-789',
  populationType: 'geography',
};

export const mockSimulationMinimal: Simulation = {
  id: '112',  // String version of metadata.id
  countryId: TEST_COUNTRIES.CA,
  apiVersion: '1.0.0',
  policyId: '113',  // String version of metadata.policy_id
  populationId: 'household-minimal',
  populationType: 'household',
};

// Mock partial simulations for creation
export const mockPartialSimulationForCreation: Partial<Simulation> = {
  populationId: TEST_HOUSEHOLD_ID,
  populationType: 'household',
  policyId: '456',  // String in frontend, will be converted to number
};

export const mockPartialSimulationWithGeographyForCreation: Partial<Simulation> = {
  populationId: 'geography-789',
  populationType: 'geography',
  policyId: '101',  // String in frontend, will be converted to number
};

export const mockPartialSimulationMissingPopulation: Partial<Simulation> = {
  policyId: TEST_POLICY_ID,
  // populationId missing
};

// Expected creation payloads (API request format)
export const mockSimulationCreationPayloadComplete: SimulationCreationPayload = {
  population_id: TEST_HOUSEHOLD_ID,
  population_type: 'household',
  policy_id: 456,  // Changed from string to number
};

export const mockSimulationCreationPayloadWithGeography: SimulationCreationPayload = {
  population_id: 'geography-789',
  population_type: 'geography',
  policy_id: 101,  // Changed from null to number (backend requires policy_id)
};

export const mockSimulationCreationPayloadMinimal: SimulationCreationPayload = {
  population_id: 'household-minimal',
  population_type: 'household',
  policy_id: 113,  // Changed from null to number (backend requires policy_id)
};

// Error messages for adapter validation
export const SIMULATION_ADAPTER_ERROR_MESSAGES = {
  MISSING_POPULATION_ID: 'Simulation metadata missing population_id',
  MISSING_POPULATION_TYPE: 'Simulation metadata missing population_type',
  CREATION_MISSING_POPULATION_ID: 'Simulation must have a populationId',
} as const;

// Test data groupings for different scenarios
export const TEST_SIMULATION_SCENARIOS = {
  COMPLETE_HOUSEHOLD: {
    metadata: mockSimulationMetadataComplete,
    simulation: mockSimulationComplete,
    creationPayload: mockSimulationCreationPayloadComplete,
  },
  GEOGRAPHY_BASED: {
    metadata: mockSimulationMetadataWithGeography,
    simulation: mockSimulationWithGeography,
    creationPayload: mockSimulationCreationPayloadWithGeography,
  },
  MINIMAL_NO_POLICY: {
    metadata: mockSimulationMetadataMinimal,
    simulation: mockSimulationMinimal,
    creationPayload: mockSimulationCreationPayloadMinimal,
  },
} as const;
