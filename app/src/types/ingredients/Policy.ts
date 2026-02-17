import { countryIds } from '@/libs/countries';
import { Parameter } from '@/types/subIngredients/parameter';

/**
 * Base Policy type containing only immutable values sent to the API
 */
export interface Policy {
  id?: string;
  countryId?: (typeof countryIds)[number];
  taxBenefitModelId?: string; // UUID of the tax benefit model (v2 API)
  apiVersion?: string;
  parameters?: Parameter[];
  label?: string | null;
  isCreated?: boolean;
}
