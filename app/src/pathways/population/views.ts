import { ViewList } from '@/pathways/core/types';
import { PopulationState, PopulationViewKey } from './types';
import SelectGeographicScopeView from './views/SelectGeographicScopeView';
import SetPopulationLabelView from './views/SetPopulationLabelView';
import HouseholdBuilderView from './views/HouseholdBuilderView';
import GeographicConfirmationView from './views/GeographicConfirmationView';

/**
 * All views available in the population pathway.
 *
 * These views are exported as individual, reusable units that can be:
 * - Used in the standard population pathway (PopulationPathwayWrapper)
 * - Cherry-picked for custom pathways
 * - Spread into other pathway configurations
 *
 * Each view defines:
 * - The component to render
 * - What layout type it needs (standard)
 * - Optional validation before proceeding to next step
 */
export const POPULATION_VIEWS: ViewList<PopulationViewKey, PopulationState> = {
  'select-scope': {
    key: 'select-scope',
    component: SelectGeographicScopeView,
    layoutType: 'standard',
  },

  'set-label': {
    key: 'set-label',
    component: SetPopulationLabelView,
    layoutType: 'standard',
  },

  'build-household': {
    key: 'build-household',
    component: HouseholdBuilderView,
    layoutType: 'standard',
  },

  'confirm-geographic': {
    key: 'confirm-geographic',
    component: GeographicConfirmationView,
    layoutType: 'standard',
  },
};
