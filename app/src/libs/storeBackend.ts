/**
 * Store Backend Selection
 *
 * Centralized logic for determining whether association data should be
 * read from the v2 API or localStorage.
 *
 * All user-ingredient associations (reports, simulations, policies,
 * households) are stored in the v2 API. The only thing in localStorage
 * is the anonymous user UUID.
 *
 * Failure mode: if the v2 API is unreachable, callers will receive
 * unhandled fetch errors. There is currently no automatic fallback to
 * localStorage. To temporarily switch backends during an incident, set
 * the VITE_STORE_BACKEND environment variable to 'localStorage'.
 */

export type StoreBackend = 'api' | 'localStorage';

export function getStoreBackend(): StoreBackend {
  const envOverride = (
    typeof import.meta !== 'undefined' ? import.meta.env?.VITE_STORE_BACKEND : undefined
  ) as string | undefined;
  if (envOverride === 'api' || envOverride === 'localStorage') {
    return envOverride;
  }
  return 'api';
}
