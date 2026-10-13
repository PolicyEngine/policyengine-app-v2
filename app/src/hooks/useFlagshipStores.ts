import { useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { getFlagshipReportStore, type FlagshipReportStore } from '@/api/flagshipReportStore';
import { getReformStore, type ReformStore } from '@/api/reformStore';
import { deferredFlagshipReportStore, deferredReformStore } from '@/api/settledStores';
import {
  accountStoreContext,
  useAssociationBackend,
  useAssociationBackendResolver,
  type AssociationBackend,
} from '@/libs/auth/useAssociationBackend';
import type { RootState } from '@/store';
import type { ParameterMetadataCollection } from '@/types/metadata/parameterMetadata';

/**
 * The flagship (v3) stores for the current session: the account's when
 * signed in (US/UK), localStorage otherwise. A signed-in session whose
 * account could not be loaded gets the account stores, whose calls fail,
 * rather than localStorage. The stores wait for the session to be
 * restored, so nothing is written to the wrong one while it is.
 */

function accountReformStore(
  backend: AssociationBackend,
  getParameterMetadata: () => ParameterMetadataCollection | null | undefined
): ReformStore {
  return getReformStore(accountStoreContext(backend), { getParameterMetadata });
}

export function useReformStore(): ReformStore {
  const resolveBackend = useAssociationBackendResolver();
  const parameters = useSelector((state: RootState) => state.metadata?.parameters);
  // Read through a ref so metadata arriving later does not rebuild the store.
  const parametersRef = useRef(parameters);
  parametersRef.current = parameters;

  return useMemo(
    () =>
      deferredReformStore(async () =>
        accountReformStore(await resolveBackend(), () => parametersRef.current)
      ),
    [resolveBackend]
  );
}

/** Where a flagship run records its report. */
export interface FlagshipRunDestination {
  /** The account's report store and user; null keeps the run in this browser. */
  account: { reportStore: FlagshipReportStore; userId: string } | null;
  /** Set when signed in but the account could not be loaded: the run must not start. */
  accountError: Error | null;
}

function flagshipRunDestination(backend: AssociationBackend): FlagshipRunDestination {
  if (backend.mode === 'unavailable') {
    return { account: null, accountError: backend.error };
  }
  if (backend.mode === 'api') {
    return {
      account: { reportStore: getFlagshipReportStore(backend), userId: backend.userId },
      accountError: null,
    };
  }
  return { account: null, accountError: null };
}

export interface FlagshipReportStoreSelection {
  /** Waits for the session to be restored. */
  store: FlagshipReportStore;
  /** True when records go to the account (one `/v2/user-reports` row per run). */
  isAccount: boolean;
  /** The user ID records are filed under. */
  userId: string;
  /** False while the session is being restored. */
  ready: boolean;
  /** Where a run records its report, once the session is restored. */
  resolveRunDestination: () => Promise<FlagshipRunDestination>;
}

export function useFlagshipReportStore(): FlagshipReportStoreSelection {
  const backend = useAssociationBackend();
  const resolveBackend = useAssociationBackendResolver();
  return useMemo(
    () => ({
      store: deferredFlagshipReportStore(async () =>
        getFlagshipReportStore(accountStoreContext(await resolveBackend()))
      ),
      isAccount: backend.mode !== 'localStorage',
      userId: backend.userId,
      ready: backend.ready,
      resolveRunDestination: async () => flagshipRunDestination(await resolveBackend()),
    }),
    [backend, resolveBackend]
  );
}

/**
 * The account's record for an API report — its title, source note and
 * provisions — so a report opened on another device shows the same
 * header. Signed-in (US/UK) sessions only; null otherwise.
 */
export function useAccountReportRecord(apiReportId: string | undefined) {
  const { store, isAccount, userId, ready } = useFlagshipReportStore();
  const { data } = useQuery({
    queryKey: ['flagship-report-record', userId, apiReportId ?? ''],
    queryFn: () => store.findByApiReportId(userId, apiReportId!),
    enabled: isAccount && ready && !!apiReportId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  return isAccount ? (data ?? null) : null;
}
