import { Population } from '@/types/ingredients/Population';
import { Simulation } from '@/types/ingredients/Simulation';

/**
 * Creates a mock simulation with a population ID
 */
export function mockSimulationWithPopulation(populationId: string | undefined): Simulation {
  return {
    id: 'sim-123',
    label: 'Test Simulation',
    isCreated: true,
    populationId,
    populationType: populationId ? 'household' : undefined,
    policyId: 'policy-123',
  };
}

/**
 * Creates a mock population that has been created
 */
export function mockPopulationCreated(): Population {
  return {
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
}

/**
 * Creates a mock population that has not been created yet
 */
export function mockPopulationNotCreated(): Population {
  return {
    label: 'Test Population',
    isCreated: false,
    household: null,
    geography: null,
  };
}
