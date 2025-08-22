import { countryIds } from '@/libs/countries';

/**
 * Base Simulation type containing only immutable values sent to the API
 */
export interface Simulation {
  id: string;
  countryId: (typeof countryIds)[number];
  apiVersion: string;
  populationId: string;
  policyId: string;
}
