import { CountryId } from '@/api/report';
import { Geography } from '@/types/ingredients/Geography';
import { Household } from '@/types/ingredients/Household';

/**
 * Valid view keys for the population pathway.
 */
export type PopulationViewKey =
  | 'select-scope'
  | 'set-label'
  | 'build-household'
  | 'confirm-geographic';

/**
 * Population type - determines which pathway branch to take.
 */
export type PopulationType = 'geography' | 'household';

/**
 * State managed by the population pathway.
 *
 * A population can be either:
 * - A custom household (type: 'household', has `household` property)
 * - A geographic collection (type: 'geography', has `geography` property)
 */
export interface PopulationState {
  label: string;
  countryId: CountryId;

  // Type discriminator for pathway branching
  type?: PopulationType;

  // Geographic population properties
  geography?: Geography | null;

  // Household population properties
  household?: Household | null;

  // Metadata
  isCreated?: boolean;
}

/**
 * Scope type for geographic selection.
 */
export type ScopeType = 'national' | 'country' | 'constituency' | 'state' | 'household';
