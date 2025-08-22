import { countryIds } from '@/libs/countries';

/**
 * Base Simulation type containing only immutable values sent to the API
 */
export interface Simulation {
  id: number;
  countryId: (typeof countryIds)[number];
  apiVersion: string;
  populationId: number;
  policyId: number;
}
