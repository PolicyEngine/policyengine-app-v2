import { useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { getFlagshipReportStore, type FlagshipReportStore } from '@/api/flagshipReportStore';
import { getReformStore, type ReformStore } from '@/api/reformStore';
import { accountStoreContext, useAssociationBackend } from '@/libs/auth/useAssociationBackend';
import type { RootState } from '@/store';

/**
 * The flagship (v3) stores for the current session: the account's when
 * signed in (US/UK), localStorage otherwise. A signed-in session whose
 * account could not be loaded gets the account stores, whose calls fail,
 * rather than localStorage.
 */

export function useReformStore(): ReformStore {
  const backend = useAssociationBackend();
  const parameters = useSelector((state: RootState) => state.metadata?.parameters);
  // Read through a ref so metadata arriving later does not rebuild the store.
  const parametersRef = useRef(parameters);
  parametersRef.current = parameters;

  return useMemo(
    () =>
      getReformStore(accountStoreContext(backend), {
        getParameterMetadata: () => parametersRef.current,
      }),
    [backend]
  );
}

export interface FlagshipReportStoreSelection {
  store: FlagshipReportStore;
  /** True when records go to the account (one `/v2/user-reports` row per run). */
  isAccount: boolean;
  /** The user ID records are filed under. */
  userId: string;
  /** False while the session is being restored. */
  ready: boolean;
  /** Set when signed in but the account could not be loaded: nothing can be saved. */
  accountError: Error | null;
}

export function useFlagshipReportStore(): FlagshipReportStoreSelection {
  const backend = useAssociationBackend();
  return useMemo(
    () => ({
      store: getFlagshipReportStore(accountStoreContext(backend)),
      isAccount: backend.mode !== 'localStorage',
      userId: backend.userId,
      ready: backend.ready,
      accountError: backend.mode === 'unavailable' ? backend.error : null,
    }),
    [backend]
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
