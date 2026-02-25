/**
 * Store Backend Selection
 *
 * Centralized logic for determining whether association data should be
 * read from the v2 API or localStorage. After the v1→v2 migration
 * completes, all association hooks switch to the API store.
 */

import { isMigrationComplete } from './v1Migration';

export type StoreBackend = 'api' | 'localStorage';

/**
 * Determines which store backend to use for association data.
 * After v1→v2 migration completes, the API store is used.
 * Before migration (or if migration hasn't run), localStorage is used.
 */
export function getStoreBackend(): StoreBackend {
  return isMigrationComplete() ? 'api' : 'localStorage';
}
