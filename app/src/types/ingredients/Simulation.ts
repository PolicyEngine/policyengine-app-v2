import { countryIds } from '@/libs/countries';

/**
 * Base Simulation type containing only immutable values sent to the API
 * The populationId can be either a household ID or geography ID
 * The Simulation is agnostic to which type of population it references
 */
export interface Simulation {
  id?: string;
  countryId?: (typeof countryIds)[number];
  apiVersion?: string;
  policyId?: string;
  populationId?: string; // Can be either householdId or geographyId
  populationType?: 'household' | 'geography'; // Indicates the type of populationId
  label?: string | null;
  isCreated?: boolean;
}
