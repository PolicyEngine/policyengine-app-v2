import {
  isGeographicMetadataWithAssociation,
  UserGeographicMetadataWithAssociation,
} from '@/hooks/useUserGeographic';
import {
  isHouseholdMetadataWithAssociation,
  UserHouseholdMetadataWithAssociation,
} from '@/hooks/useUserHousehold';
import { Simulation } from '@/types/ingredients/Simulation';

/**
 * Finds a matching population from user data based on simulation's populationId.
 * Used in locked mode to auto-populate the population from another simulation.
 *
 * @param simulation - The simulation containing the populationId to match
 * @param householdData - Array of user household populations
 * @param geographicData - Array of user geographic populations
 * @returns The matched population association, or null if not found
 */
export function findMatchingPopulation(
  simulation: Simulation | null,
  householdData: UserHouseholdMetadataWithAssociation[] | undefined,
  geographicData: UserGeographicMetadataWithAssociation[] | undefined
): UserHouseholdMetadataWithAssociation | UserGeographicMetadataWithAssociation | null {
  if (!simulation?.populationId) {
    return null;
  }

  // Search in household data if it's a household population
  if (simulation.populationType === 'household' && householdData) {
    const match = householdData.find(
      (h) => isHouseholdMetadataWithAssociation(h) && h.household?.id === simulation.populationId
    );
    return match || null;
  }

  // Search in geographic data if it's a geography population
  if (simulation.populationType === 'geography' && geographicData) {
    const match = geographicData.find(
      (g) => isGeographicMetadataWithAssociation(g) && g.geography?.id === simulation.populationId
    );
    return match || null;
  }

  return null;
}
