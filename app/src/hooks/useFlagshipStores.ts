import { useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { getFlagshipReportStore, type FlagshipReportStore } from '@/api/flagshipReportStore';
import { fetchV1PolicyJson, getReformStore, type ReformStore } from '@/api/reformStore';
import type { ApiStoreContext } from '@/api/v2Associations';
import { useCountryContext } from '@/contexts/CountryContext';
import { useAuthStatus } from '@/libs/auth/AuthContext';
import { getBrowserUserId } from '@/libs/auth/browserUser';
import { useV2UserClient } from '@/libs/auth/useV2UserClient';
import type { RootState } from '@/store';
import { isAssociationCountry } from '@/types/v2User';

/**
 * Where the v3 workspace keeps saved work. Wherever accounts exist (sign-in
 * configured, US and UK) it is the PolicyEngine API: as the signed-in
 * account, or signed out as this browser's unauthenticated user. Without
 * sign-in (and outside the US and UK) it stays in this browser. Nothing
 * else decides it, and nothing falls back: a request that fails is an
 * ordinary error.
 */
export interface V3SavedWork {
  /** The API routes for this session's user; null keeps saved work in this browser. */
  account: ApiStoreContext | null;
  /**
   * Scopes cached saved work to whose it is: the Auth0 subject when signed
   * in, this browser's unauthenticated user when signed out, 'browser'
   * otherwise. A session that ends without a reload moves every query to
   * new keys.
   */
  scope: string;
}

export function useV3SavedWork(): V3SavedWork {
  const { status, subject } = useAuthStatus();
  const countryId = useCountryContext();
  const client = useV2UserClient();
  const browserUserId = status === 'signed_out' ? getBrowserUserId() : null;
  return useMemo(() => {
    if (!isAssociationCountry(countryId)) {
      return { account: null, scope: 'browser' };
    }
    if (status === 'signed_in' && subject) {
      return { account: { client, countryId }, scope: `account:${subject}` };
    }
    if (browserUserId) {
      return { account: { client, countryId }, scope: `browser-user:${browserUserId}` };
    }
    return { account: null, scope: 'browser' };
  }, [status, subject, browserUserId, countryId, client]);
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
 * This session's record of an API report — the account's when signed in
 * (US/UK), this browser's otherwise — with its title, source note,
 * provisions and the saved reform it was run from. Null when there is
 * none (a report shared from elsewhere).
 */
export function useReportRecord(apiReportId: string | undefined) {
  const { store, scope } = useFlagshipReportStore();
  const { data } = useQuery({
    queryKey: ['flagship-report-record', scope, apiReportId ?? ''],
    queryFn: () => store.findByApiReportId(apiReportId!),
    enabled: !!apiReportId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  return data ?? null;
}

/**
 * The account's record for an API report, so a report opened on another
 * device shows the same header. Signed-in (US/UK) sessions only; null
 * otherwise.
 */
export function useAccountReportRecord(apiReportId: string | undefined) {
  const { isAccount } = useFlagshipReportStore();
  const record = useReportRecord(apiReportId);
  return isAccount ? record : null;
}
