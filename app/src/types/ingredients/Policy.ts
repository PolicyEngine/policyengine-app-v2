import { countryIds } from '@/libs/countries';
import { Parameter } from '@/types/subIngredients/parameter';

/**
 * Base Policy type containing only immutable values sent to the API
 */
export interface Policy {
  id?: string;
  countryId?: (typeof countryIds)[number];
  apiVersion?: string;
  parameters?: Parameter[];
  label?: string | null;
  isCreated?: boolean;
}
