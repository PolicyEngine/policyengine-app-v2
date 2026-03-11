/**
 * Store Backend Selection
 *
 * Centralized logic for determining whether association data should be
 * read from the v2 API or localStorage.
 *
 * All user-ingredient associations (reports, simulations, policies,
 * households) are stored in the v2 API. The only thing in localStorage
 * is the anonymous user UUID.
 */

export type StoreBackend = 'api' | 'localStorage';

export function getStoreBackend(): StoreBackend {
  return 'api';
}
