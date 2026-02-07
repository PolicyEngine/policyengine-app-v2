import { countryIds } from '@/libs/countries';
import { Parameter } from '@/types/subIngredients/parameter';

/**
 * Base Policy type containing only immutable values sent to the API
 *
 * In V2 API:
 * - id = null → current law (baseline)
 * - id = UUID string → reform policy
 * - id = undefined → not yet configured
 */
export interface Policy {
  id?: string | null;
  countryId?: (typeof countryIds)[number];
  apiVersion?: string;
  parameters?: Parameter[];
  label?: string | null;
  isCreated?: boolean;
}
