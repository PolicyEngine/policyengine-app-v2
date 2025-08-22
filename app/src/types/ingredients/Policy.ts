import { countryIds } from '@/libs/countries';
import { Parameter } from '@/types/parameter';

/**
 * Base Policy type containing only immutable values sent to the API
 */
export interface Policy {
  id: number;
  countryId: (typeof countryIds)[number];
  apiVersion: string;
  parameters: Parameter[];
}