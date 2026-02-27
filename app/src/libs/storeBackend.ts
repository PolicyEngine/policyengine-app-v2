/**
 * Store Backend Selection
 *
 * Centralized logic for determining whether association data should be
 * read from the v2 API or localStorage.
 *
 * localStorage is the source of truth until real authentication provides
 * stable server-side user identities. The v2 API requires UUID user IDs,
 * but we generate anonymous UUIDs per-browser which are not yet persisted
 * server-side across devices.
 */

export type StoreBackend = 'api' | 'localStorage';

export function getStoreBackend(): StoreBackend {
  return 'localStorage';
}
