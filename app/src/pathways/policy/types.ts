import { CountryId } from '@/api/report';
import { Parameter } from '@/types/subIngredients/parameter';

/**
 * Valid view keys for the policy pathway.
 */
export type PolicyViewKey = 'create' | 'select-parameters' | 'submit';

/**
 * State managed by the policy pathway.
 */
export interface PolicyState {
  label: string;
  parameters: Parameter[];
  countryId: CountryId;
  position: number;
}
