import { useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { getFlagshipReportStore, type FlagshipReportStore } from '@/api/flagshipReportStore';
import { fetchV1PolicyJson, getReformStore, type ReformStore } from '@/api/reformStore';
import type { ApiStoreContext } from '@/api/v2Associations';
import { MOCK_USER_ID } from '@/constants';
import { useCountryContext } from '@/contexts/CountryContext';
import { useAuthStatus } from '@/libs/auth/AuthContext';
import { useV2UserClient } from '@/libs/auth/useV2UserClient';
import type { RootState } from '@/store';
import { isAssociationCountry } from '@/types/v2User';

/**
 * Where the v3 workspace keeps saved work: the account when signed in (US
 * and UK), this browser otherwise. Nothing else decides it, and nothing
 * falls back: an account request that fails is an ordinary error.
 */
export interface V3SavedWork {
  /** The account's routes when signed in; null keeps saved work in this browser. */
  account: ApiStoreContext | null;
  /**
   * Scopes cached saved work to the session: the Auth0 subject when
   * signed in, 'browser' otherwise. Signing in or out reloads the page; a
   * session that ends without a reload moves every query to new keys.
   */
  scope: string;
}

export function useV3SavedWork(): V3SavedWork {
  const { status, subject } = useAuthStatus();
  const countryId = useCountryContext();
  const client = useV2UserClient();
  return useMemo(
    () =>
      status === 'signed_in' && subject && isAssociationCountry(countryId)
        ? {
            account: { client, countryId },
            scope: `account:${subject}`,
          }
        : { account: null, scope: 'browser' },
    [status, subject, countryId, client]
  );
}

/** A v1 policy's raw parameter map (`policy_json`), per country. */
const v1PolicyJsonKey = (countryId: string, policyId: string) =>
  ['v1-policy-json', countryId, policyId] as const;

/** How long a fetched v1 policy stays cached without a reader. */
const V1_POLICY_JSON_GC_TIME = 30 * 60 * 1000;

export function useReformStore(): ReformStore {
  const { account } = useV3SavedWork();
  const parameters = useSelector((state: RootState) => state.metadata?.parameters);
  // Read through a ref so metadata arriving later does not rebuild the store.
  const parametersRef = useRef(parameters);
  parametersRef.current = parameters;
  const queryClient = useQueryClient();

  return useMemo(
    () =>
      getReformStore(account, {
        getParameterMetadata: () => parametersRef.current,
        // v1 policies never change, so each is fetched once per session
        // rather than on every list of the account's reforms.
        fetchPolicyJson: (countryId, policyId) =>
          queryClient.fetchQuery({
            queryKey: v1PolicyJsonKey(countryId, policyId),
            queryFn: () => fetchV1PolicyJson(countryId, policyId),
            staleTime: Infinity,
            gcTime: V1_POLICY_JSON_GC_TIME,
          }),
      }),
    [account, queryClient]
  );
}

export interface FlagshipReportStoreSelection {
  store: FlagshipReportStore;
  /** True when records go to the account (one `/v2/user-reports` row per run). */
  isAccount: boolean;
  /** The session scope for cached records (see V3SavedWork). */
  scope: string;
}

export function useFlagshipReportStore(): FlagshipReportStoreSelection {
  const { account, scope } = useV3SavedWork();
  return useMemo(
    () => ({
      store: getFlagshipReportStore(account),
      isAccount: !!account,
      scope,
    }),
    [account, scope]
  );
}

/**
 * The account's record for an API report — its title, source note and
 * provisions — so a report opened on another device shows the same
 * header. Signed-in (US/UK) sessions only; null otherwise.
 */
export function useAccountReportRecord(apiReportId: string | undefined) {
  const { store, isAccount, scope } = useFlagshipReportStore();
  const { data } = useQuery({
    queryKey: ['flagship-report-record', scope, apiReportId ?? ''],
    queryFn: () => store.findByApiReportId(MOCK_USER_ID, apiReportId!),
    enabled: isAccount && !!apiReportId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  return isAccount ? (data ?? null) : null;
}
