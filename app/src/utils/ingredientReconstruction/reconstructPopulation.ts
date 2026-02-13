import { Geography } from '@/types/ingredients/Geography';
import { Household } from '@/types/ingredients/Household';
import { PopulationStateProps } from '@/types/pathwayState';

/**
 * Reconstructs a PopulationStateProps object from a household
 * Used when loading existing household populations in pathways
 *
 * @param householdId - The household ID
 * @param household - The household data
 * @param label - The population label
 * @returns A fully-formed PopulationStateProps object
 */
export function reconstructPopulationFromHousehold(
  householdId: string,
  household: Household,
  label: string | null
): PopulationStateProps {
  return {
    household: { ...household, id: householdId },
    geography: null,
    label,
    type: 'household',
  };
}

/**
 * Reconstructs a PopulationStateProps object from a geography
 * Used when loading existing geographic populations in pathways
 *
 * @param geography - The geography data (contains countryId and regionCode)
 * @param label - The population label
 * @returns A fully-formed PopulationStateProps object
 */
export function reconstructPopulationFromGeography(
  geography: Geography,
  label: string | null
): PopulationStateProps {
  return {
    household: null,
    geography,
    label,
    type: 'geography',
  };
}
