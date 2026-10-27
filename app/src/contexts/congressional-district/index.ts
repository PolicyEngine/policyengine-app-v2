/**
 * Congressional District Data Context
 *
 * Provides congressional district label lookup and an optional manual fetch path.
 */

export {
  CongressionalDistrictDataProvider,
  useCongressionalDistrictData,
} from './CongressionalDistrictDataContext';

export type {
  StateDistrictData,
  FetchState,
  FetchAction,
  CongressionalDistrictDataContextValue,
  CongressionalDistrictDataProviderProps,
} from './types';

export { POLL_INTERVAL_MS, MAX_POLL_ATTEMPTS } from './types';

export type { CongressionalDistrictScope } from './utils';

export {
  congressionalDistrictScope,
  isStateLevelRegion,
  extractStateCode,
  getStateCodesToFetch,
  calculateTotalDistrictsLoaded,
  computeFetchStatus,
  validateAllStatesLoaded,
} from './utils';
