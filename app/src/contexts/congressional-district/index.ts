/**
 * Congressional District Data Context
 *
 * Gives a report's congressional district views their labels, state code,
 * policies, year and district scope.
 */

export {
  CongressionalDistrictDataProvider,
  useCongressionalDistrictData,
} from './CongressionalDistrictDataContext';

export type {
  CongressionalDistrictDataContextValue,
  CongressionalDistrictDataProviderProps,
} from './types';

export type { CongressionalDistrictScope } from './utils';

export { congressionalDistrictScope, isStateLevelRegion, extractStateCode } from './utils';
