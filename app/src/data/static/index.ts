import { getBasicInputs } from './basicInputs';
import { getEntities } from './entities';
import { getCurrentLawId, getModelledPolicies } from './modelledPolicies';
import { getTimePeriods } from './timePeriods';

/**
 * Static metadata loader
 * Provides country-specific static data that doesn't come from the API
 */

// Entity definitions
export {
  getEntities,
  US_ENTITIES,
  UK_ENTITIES,
  type EntityInfo,
  type EntitiesRecord,
} from './entities';

// Basic input fields
export { getBasicInputs, US_BASIC_INPUTS, UK_BASIC_INPUTS } from './basicInputs';

// Modelled policies
export {
  getModelledPolicies,
  getCurrentLawId,
  CURRENT_LAW_ID,
  US_MODELLED_POLICIES,
  UK_MODELLED_POLICIES,
  type PolicyInfo,
  type ModelledPolicies,
} from './modelledPolicies';

// Time periods
export {
  getTimePeriods,
  US_TIME_PERIODS,
  UK_TIME_PERIODS,
  type TimePeriodOption,
} from './timePeriods';

// Tax year utilities
export { getTaxYears, getDateRange } from './taxYears';

/**
 * Get all static data for a country
 *
 * Note: Regions are now fetched from the V2 API via useRegions() hook.
 * See @/hooks/useRegions for region data.
 */
export function getStaticData(countryId: string) {
  return {
    entities: getEntities(countryId),
    basicInputs: getBasicInputs(countryId),
    modelledPolicies: getModelledPolicies(countryId),
    currentLawId: getCurrentLawId(countryId),
    timePeriods: getTimePeriods(countryId),
  };
}
