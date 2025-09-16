import { countryIds } from '@/libs/countries';

/**
 * Simulation type for position-based storage
 * ID is optional and only exists after API creation
 * The populationId can be either a household ID or geography ID
 * The Simulation is agnostic to which type of population it references
 */
export interface Simulation {
  id?: string; // Optional - only exists after API creation
  countryId?: (typeof countryIds)[number];
  apiVersion?: string;
  policyId?: string;
  populationId?: string; // Can be either householdId or geographyId
  populationType?: 'household' | 'geography'; // Indicates the type of populationId
  label: string | null; // Always present, even if null
  isCreated: boolean; // Always present, defaults to false
}
