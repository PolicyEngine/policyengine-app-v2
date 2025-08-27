import { Geography } from './Geography';
import { Household } from './Household';

/**
 * Population type for Redux state management
 * Can contain either a Household or Geography, plus metadata
 */
export interface Population {
  label?: string | null;
  isCreated?: boolean;
  household?: Household | null;
  geography?: Geography | null;
}
