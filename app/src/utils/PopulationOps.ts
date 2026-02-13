import { UserPopulation } from '@/types/ingredients/UserPopulation';

/**
 * Population reference types used in Simulation
 */
export type HouseholdPopulationRef = {
  type: 'household';
  householdId: string;
};

export type GeographyPopulationRef = {
  type: 'geography';
  geographyId: string;
};

export type PopulationRef = HouseholdPopulationRef | GeographyPopulationRef;

/**
 * Helper function for pattern matching on population references
 * Ensures type-safe handling of all population variants
 */
export function matchPopulation<T>(
  population: PopulationRef,
  handlers: {
    household: (p: HouseholdPopulationRef) => T;
    geography: (p: GeographyPopulationRef) => T;
  }
): T {
  if (population.type === 'household') {
    return handlers.household(population as HouseholdPopulationRef);
  }

  return handlers.geography(population as GeographyPopulationRef);
}

/**
 * Centralized operations for working with population references
 * Eliminates the need for if/else checks throughout the codebase
 */
export const PopulationOps = {
  /**
   * Get the ID/identifier for a population reference
   */
  getId: (p: PopulationRef): string =>
    matchPopulation(p, {
      household: (h) => h.householdId,
      geography: (g) => g.geographyId,
    }),

  /**
   * Get a display label for a population reference
   */
  getLabel: (p: PopulationRef): string =>
    matchPopulation(p, {
      household: (h) => `Household ${h.householdId}`,
      geography: (g) => `All households in ${g.geographyId}`,
    }),

  /**
   * Get a short type label for UI display
   */
  getTypeLabel: (p: PopulationRef): string =>
    matchPopulation(p, {
      household: () => 'Household',
      geography: () => 'Household collection',
    }),

  /**
   * Convert to API payload format for simulation creation
   */
  toAPIPayload: (p: PopulationRef): Record<string, any> =>
    matchPopulation(p, {
      household: (h) =>
        ({
          population_id: h.householdId,
          household_id: h.householdId, // Include both for backwards compatibility
        }) as Record<string, any>,
      geography: (g) =>
        ({
          geography_id: g.geographyId,
          region: g.geographyId, // Some APIs might expect 'region' instead
        }) as Record<string, any>,
    }),

  /**
   * Generate a cache key for React Query or other caching systems
   */
  getCacheKey: (p: PopulationRef): string =>
    matchPopulation(p, {
      household: (h) => `household:${h.householdId}`,
      geography: (g) => `geography:${g.geographyId}`,
    }),

  /**
   * Check if a population reference is valid
   */
  isValid: (p: PopulationRef): boolean =>
    matchPopulation(p, {
      household: (h) => !!h.householdId && h.householdId.length > 0,
      geography: (g) => !!g.geographyId && g.geographyId.length > 0,
    }),

  /**
   * Create a population reference from a UserPopulation
   * Note: UserPopulation is now only UserHouseholdPopulation (geography associations removed)
   */
  fromUserPopulation: (up: UserPopulation): PopulationRef => {
    return { type: 'household', householdId: up.householdId };
  },

  /**
   * Check equality between two population references
   */
  isEqual: (p1: PopulationRef, p2: PopulationRef): boolean => {
    if (p1.type !== p2.type) {
      return false;
    }
    return PopulationOps.getId(p1) === PopulationOps.getId(p2);
  },

  /**
   * Create a household population reference
   */
  household: (householdId: string): HouseholdPopulationRef => ({
    type: 'household',
    householdId,
  }),

  /**
   * Create a geography population reference
   */
  geography: (geographyId: string): GeographyPopulationRef => ({
    type: 'geography',
    geographyId,
  }),
};

/**
 * Operations specific to UserPopulation (which is now just UserHouseholdPopulation)
 * Note: Geographic populations are no longer stored as user associations.
 */
export const UserPopulationOps = {
  /**
   * Get the ID for a UserPopulation
   */
  getId: (p: UserPopulation): string => p.householdId,

  /**
   * Get a display label for a UserPopulation
   */
  getLabel: (p: UserPopulation): string => p.label || `Household ${p.householdId}`,

  /**
   * Convert UserPopulation to PopulationRef for use in Simulation
   */
  toPopulationRef: (p: UserPopulation): PopulationRef => PopulationOps.fromUserPopulation(p),

  /**
   * Check if a UserPopulation is valid
   */
  isValid: (p: UserPopulation): boolean => !!p.householdId && !!p.userId,
};
