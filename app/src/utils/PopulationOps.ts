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
 * Helper function for UserPopulation pattern matching
 */
export function matchUserPopulation<T>(
  population: UserPopulation,
  handlers: {
    household: (p: Extract<UserPopulation, { type: 'household' }>) => T;
    geography: (p: Extract<UserPopulation, { type: 'geography' }>) => T;
  }
): T {
  if (population.type === 'household') {
    return handlers.household(population as Extract<UserPopulation, { type: 'household' }>);
  }

  return handlers.geography(population as Extract<UserPopulation, { type: 'geography' }>);
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
   */
  fromUserPopulation: (up: UserPopulation): PopulationRef => {
    if (up.type === 'household') {
      return { type: 'household', householdId: up.householdId };
    }

    return { type: 'geography', geographyId: up.geographyId };
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
 * Operations specific to UserPopulation
 */
export const UserPopulationOps = {
  /**
   * Get the ID for a UserPopulation
   */
  getId: (p: UserPopulation): string =>
    matchUserPopulation(p, {
      household: (h) => h.householdId,
      geography: (g) => g.geographyId,
    }),

  /**
   * Get a display label for a UserPopulation
   */
  getLabel: (p: UserPopulation): string =>
    p.label ||
    matchUserPopulation(p, {
      household: (h) => `Household ${h.householdId}`,
      geography: (g) =>
        `${g.scope === 'national' ? 'National households' : 'Households in'} ${g.geographyId}`,
    }),

  /**
   * Convert UserPopulation to PopulationRef for use in Simulation
   */
  toPopulationRef: (p: UserPopulation): PopulationRef => PopulationOps.fromUserPopulation(p),

  /**
   * Check if a UserPopulation is valid
   */
  isValid: (p: UserPopulation): boolean =>
    matchUserPopulation(p, {
      household: (h) => !!h.householdId && !!h.userId,
      geography: (g) => !!g.geographyId && !!g.countryId,
    }),
};
