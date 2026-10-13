import { useMemo } from 'react';
import { deferredStore, type AsyncStore, type StoreMethods } from '@/api/deferredStore';
import {
  useAssociationBackend,
  useAssociationBackendResolver,
  type AssociationBackend,
} from '@/libs/auth/useAssociationBackend';
import { queryConfig } from '@/libs/queryConfig';

export interface SavedWorkStoreSelection<Store> {
  /** Waits for the session to be restored, so nothing goes to the wrong store. */
  store: Store;
  config: typeof queryConfig.api | typeof queryConfig.localStorage;
  /** False while the session is being restored; queries wait. */
  ready: boolean;
}

/**
 * The saved-work store for the session: `storeFor` picks it for a settled
 * backend (the account's, or localStorage), and the returned store waits
 * for the session before each call. `storeFor` and `methods` must be
 * stable (module-level, or memoised).
 */
export function useSavedWorkStore<Store extends AsyncStore<Store>>(
  storeFor: (backend: AssociationBackend) => Store,
  methods: StoreMethods<Store>
): SavedWorkStoreSelection<Store> {
  const backend = useAssociationBackend();
  const resolveBackend = useAssociationBackendResolver();
  return useMemo(
    () => ({
      store: deferredStore(async () => storeFor(await resolveBackend()), methods),
      config: backend.mode === 'localStorage' ? queryConfig.localStorage : queryConfig.api,
      ready: backend.ready,
    }),
    [backend, resolveBackend, storeFor, methods]
  );
}
