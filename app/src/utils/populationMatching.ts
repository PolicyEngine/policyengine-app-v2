import {
  isHouseholdMetadataWithAssociation,
  UserHouseholdMetadataWithAssociation,
} from '@/hooks/useUserHousehold';
import { Simulation } from '@/types/ingredients/Simulation';

/**
 * Finds a matching household population from user data based on simulation's populationId.
 * Used in locked mode to auto-populate the population from another simulation.
 *
 * Note: Geographic populations are no longer stored as user associations.
 * Geography selection is ephemeral and built from simulation data.
 *
 * @param simulation - The simulation containing the populationId to match
 * @param householdData - Array of user household populations
 * @returns The matched household population association, or null if not found
 */
export function findMatchingPopulation(
  simulation: Simulation | null,
  householdData: UserHouseholdMetadataWithAssociation[] | undefined
): UserHouseholdMetadataWithAssociation | null {
  if (!simulation?.populationId) {
    return null;
  }

  // Search in household data if it's a household population
  if (simulation.populationType === 'household' && householdData) {
    const match = householdData.find(
      (h) =>
        isHouseholdMetadataWithAssociation(h) &&
        String(h.household?.id) === String(simulation.populationId)
    );
    return match || null;
  }

  // Geographic populations are constructed from simulation data, not user associations
  return null;
}
