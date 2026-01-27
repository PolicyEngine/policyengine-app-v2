/**
 * Re-export from the refactored congressional-district module.
 * This file maintains backwards compatibility for existing imports.
 *
 * @deprecated Import from '@/contexts/congressional-district' instead
 */

export {
  CongressionalDistrictDataProvider,
  useCongressionalDistrictData,
} from './congressional-district';

export type {
  StateDistrictData,
  CongressionalDistrictDataContextValue,
  CongressionalDistrictDataProviderProps,
} from './congressional-district';
