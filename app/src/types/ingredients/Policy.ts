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
  taxBenefitModelId?: string; // UUID of the tax benefit model (v2 API)
  apiVersion?: string;
  parameters?: Parameter[];
  label?: string | null;
  isCreated?: boolean;
}
