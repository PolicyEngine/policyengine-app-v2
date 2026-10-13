import { useCallback, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import type { StoreMethods } from '@/api/deferredStore';
import { getFlagshipReportStore, type FlagshipReportStore } from '@/api/flagshipReportStore';
import { fetchV1PolicyJson, getReformStore, type ReformStore } from '@/api/reformStore';
import { useSavedWorkStore } from '@/hooks/utils/useSavedWorkStore';
import {
  accountStoreContext,
  useAssociationBackend,
  useAssociationBackendResolver,
  type AssociationBackend,
} from '@/libs/auth/useAssociationBackend';
import { policyKeys } from '@/libs/queryKeys';
import type { RootState } from '@/store';

/**
 * The flagship (v3) stores for the current session: the account's when
 * signed in (US/UK), localStorage otherwise. A signed-in session whose
 * account could not be loaded gets the account stores, whose calls fail,
 * rather than localStorage. The stores wait for the session to be
 * restored, so nothing is written to the wrong one while it is.
 */

/** How long a fetched v1 policy stays cached without a reader. */
const V1_POLICY_JSON_GC_TIME = 30 * 60 * 1000;

const REFORM_STORE_METHODS: StoreMethods<ReformStore> = {
  create: true,
  findByUser: true,
  findById: true,
  update: true,
  delete: true,
};

const FLAGSHIP_REPORT_STORE_METHODS: StoreMethods<FlagshipReportStore> = {
  create: true,
  findByUser: true,
  findById: true,
  findByApiReportId: true,
  saveValidation: true,
};

function flagshipReportStoreFor(backend: AssociationBackend): FlagshipReportStore {
  return getFlagshipReportStore(accountStoreContext(backend));
}

export function useReformStore(): ReformStore {
  const parameters = useSelector((state: RootState) => state.metadata?.parameters);
  // Read through a ref so metadata arriving later does not rebuild the store.
  const parametersRef = useRef(parameters);
  parametersRef.current = parameters;
  const queryClient = useQueryClient();
  const reformStoreFor = useCallback(
    (backend: AssociationBackend) =>
      getReformStore(accountStoreContext(backend), {
        getParameterMetadata: () => parametersRef.current,
        // v1 policies never change, so each is fetched once per session
        // rather than on every list of the account's reforms.
        fetchPolicyJson: (countryId, policyId) =>
          queryClient.fetchQuery({
            queryKey: policyKeys.json(countryId, policyId),
            queryFn: () => fetchV1PolicyJson(countryId, policyId),
            staleTime: Infinity,
            gcTime: V1_POLICY_JSON_GC_TIME,
          }),
      }),
    [queryClient]
  );
  return useSavedWorkStore(reformStoreFor, REFORM_STORE_METHODS).store;
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
  const { store, ready } = useSavedWorkStore(flagshipReportStoreFor, FLAGSHIP_REPORT_STORE_METHODS);
  return useMemo(
    () => ({
      store,
      isAccount: backend.mode !== 'localStorage',
      userId: backend.userId,
      ready,
      resolveRunDestination: async () => flagshipRunDestination(await resolveBackend()),
    }),
    [store, backend, ready, resolveBackend]
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
