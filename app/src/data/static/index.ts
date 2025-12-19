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
export {
  getBasicInputs,
  US_BASIC_INPUTS,
  UK_BASIC_INPUTS,
} from './basicInputs';

// Region definitions
export { getRegions, US_REGIONS, UK_REGIONS } from './regions';

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

import { getEntities } from './entities';
import { getBasicInputs } from './basicInputs';
import { getRegions } from './regions';
import { getModelledPolicies, getCurrentLawId } from './modelledPolicies';
import { getTimePeriods } from './timePeriods';

/**
 * Get all static data for a country
 */
export function getStaticData(countryId: string) {
  return {
    entities: getEntities(countryId),
    basicInputs: getBasicInputs(countryId),
    regions: getRegions(countryId),
    modelledPolicies: getModelledPolicies(countryId),
    currentLawId: getCurrentLawId(countryId),
    timePeriods: getTimePeriods(countryId),
  };
}
