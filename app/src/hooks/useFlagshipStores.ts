import { useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import {
  findReportRecordByLink,
  getFlagshipReportStore,
  parseSharedReportItem,
  type FlagshipReportRecord,
  type FlagshipReportStore,
} from '@/api/flagshipReportStore';
import { fetchV1PolicyJson, getReformStore, type ReformStore } from '@/api/reformStore';
import { fetchSharedReport } from '@/api/sharedReport';
import { isAccountId, type ApiStoreContext } from '@/api/v2Associations';
import { useCountryContext } from '@/contexts/CountryContext';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useAuthStatus } from '@/libs/auth/AuthContext';
import { getBrowserUserId } from '@/libs/auth/browserUser';
import { useV2UserClient } from '@/libs/auth/useV2UserClient';
import { unwrapReport } from '@/libs/flagship/reportSchema';
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
 * This session's record a report link names — the account's row when
 * signed in (US/UK), signed out this browser's unauthenticated user's, and
 * otherwise this browser's — with the saved reform it was run from. Null
 * when there is none: a report someone else ran.
 */
export function useReportRecord(link: string | undefined) {
  const { store, scope } = useFlagshipReportStore();
  const { data } = useQuery({
    queryKey: ['flagship-report-record', scope, link ?? ''],
    queryFn: () => findReportRecordByLink(store, link!),
    enabled: !!link,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  return data ?? null;
}

/** A saved report as anyone holding its link reads it. */
export interface SharedReport {
  /** The owner's title, source note, provisions, budget window and validation. */
  record: FlagshipReportRecord;
  /** The owner's saved reform the report was compared with; null for current law. */
  baselineReform: { name: string | null } | null;
}

/**
 * The saved report a link names (an account row's ID), read with no
 * credential, so whoever opens the link sees the report as its owner ran
 * it. Null data when no saved report has that ID; an unreadable one is an
 * error.
 */
export function useSharedReport(link: string | undefined) {
  const countryId = useCurrentCountry();
  return useQuery({
    queryKey: ['shared-report', countryId, link ?? ''],
    queryFn: async (): Promise<SharedReport | null> => {
      const item = await fetchSharedReport(countryId, link!);
      return item
        ? {
            record: unwrapReport(parseSharedReportItem(item)),
            baselineReform: item.baseline_reform,
          }
        : null;
    },
    enabled: !!link && isAccountId(link),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
