/**
 * Hook for fetching report data from a shared URL
 *
 * Unlike useUserReportById which starts from localStorage UserReport associations,
 * this hook fetches directly from API using IDs from the ShareData object.
 * Returns the same shape as useUserReportById for component compatibility.
 */

import { useSelector } from 'react-redux';
import { HouseholdAdapter, PolicyAdapter, ReportAdapter, SimulationAdapter } from '@/adapters';
import { fetchHouseholdById } from '@/api/household';
import { fetchPolicyById } from '@/api/policy';
import { fetchReportById } from '@/api/report';
import { fetchSimulationById } from '@/api/simulation';
import { DEFAULT_COUNTRY } from '@/libs/countries';
import { RootState } from '@/store';
import { Geography } from '@/types/ingredients/Geography';
import { Household } from '@/types/ingredients/Household';
import { Policy } from '@/types/ingredients/Policy';
import { Report } from '@/types/ingredients/Report';
import { Simulation } from '@/types/ingredients/Simulation';
import { ShareData } from '@/utils/shareUtils';
import { householdKeys, policyKeys, reportKeys, simulationKeys } from '../libs/queryKeys';
import { combineLoadingStates, useParallelQueries } from './utils/normalizedUtils';

interface UseSharedReportDataOptions {
  enabled?: boolean;
}

interface UseSharedReportDataResult {
  report: Report | undefined;
  simulations: Simulation[];
  policies: Policy[];
  households: Household[];
  geographies: Geography[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Fetch report data using ShareData from URL
 * Skips localStorage entirely - fetches all data from API
 */
export function useSharedReportData(
  shareData: ShareData | null,
  options?: UseSharedReportDataOptions
): UseSharedReportDataResult {
  const isEnabled = options?.enabled !== false && shareData !== null;
  const countryId = shareData?.countryId ?? DEFAULT_COUNTRY;

  // Get geography metadata for building Geography objects
  const geographyOptions = useSelector((state: RootState) => state.metadata.economyOptions.region);

  // Step 1: Fetch the base report
  const reportResults = useParallelQueries<Report>(
    shareData?.reportId ? [shareData.reportId] : [],
    {
      queryKey: reportKeys.byId,
      queryFn: async (id) => {
        const metadata = await fetchReportById(countryId, id);
        return ReportAdapter.fromMetadata(metadata);
      },
      enabled: isEnabled && !!shareData?.reportId,
      staleTime: 5 * 60 * 1000,
    }
  );

  const report = reportResults.queries[0]?.data;

  // Step 2: Fetch simulations using IDs from ShareData
  const simulationResults = useParallelQueries<Simulation>(
    isEnabled ? (shareData?.simulationIds ?? []) : [],
    {
      queryKey: simulationKeys.byId,
      queryFn: async (id) => {
        const metadata = await fetchSimulationById(countryId, id);
        return SimulationAdapter.fromMetadata(metadata);
      },
      enabled: isEnabled && (shareData?.simulationIds?.length ?? 0) > 0,
      staleTime: Infinity,
      gcTime: 0,
    }
  );

  const fetchedSimulations = simulationResults.queries
    .map((q) => q.data)
    .filter((s): s is Simulation => !!s);

  // Step 3: Fetch policies using IDs from ShareData
  const policyResults = useParallelQueries<Policy>(isEnabled ? (shareData?.policyIds ?? []) : [], {
    queryKey: policyKeys.byId,
    queryFn: async (id) => {
      const metadata = await fetchPolicyById(countryId, id);
      return PolicyAdapter.fromMetadata(metadata);
    },
    enabled: isEnabled && (shareData?.policyIds?.length ?? 0) > 0,
    staleTime: 5 * 60 * 1000,
  });

  const fetchedPolicies = policyResults.queries.map((q) => q.data).filter((p): p is Policy => !!p);

  // Step 4: Fetch household if this is a household report
  const householdIds = shareData?.householdId ? [shareData.householdId] : [];

  const householdResults = useParallelQueries<Household>(isEnabled ? householdIds : [], {
    queryKey: householdKeys.byId,
    queryFn: async (id) => {
      const metadata = await fetchHouseholdById(countryId, id);
      return HouseholdAdapter.fromMetadata(metadata);
    },
    enabled: isEnabled && householdIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const fetchedHouseholds = householdResults.queries
    .map((q) => q.data)
    .filter((h): h is Household => !!h);

  // Step 5: Build geography objects from ShareData and metadata
  const fetchedGeographies: Geography[] = [];
  if (isEnabled && shareData?.geographyId) {
    const geographyId = shareData.geographyId;
    const isNational = geographyId === countryId;

    let name: string;
    if (isNational) {
      name = countryId.toUpperCase();
    } else {
      // Extract base geography ID for subnational
      const parts = geographyId.split('-');
      const baseGeographyId = parts.length > 1 ? parts.slice(1).join('-') : geographyId;
      const regionData = geographyOptions?.find((r) => r.name === baseGeographyId);
      name = regionData?.label || geographyId;
    }

    fetchedGeographies.push({
      id: geographyId,
      countryId,
      scope: isNational ? 'national' : 'subnational',
      geographyId,
      name,
    });
  }

  // Combine loading states
  const { isLoading, error } = combineLoadingStates(
    { isLoading: reportResults.isLoading, error: reportResults.error },
    { isLoading: simulationResults.isLoading, error: simulationResults.error },
    { isLoading: policyResults.isLoading, error: policyResults.error },
    { isLoading: householdResults.isLoading, error: householdResults.error }
  );

  // Step 6: Apply labels from ShareData to fetched objects
  // This ensures the recipient sees the exact same labels as the sharer

  // Apply report label
  const reportWithLabel = report
    ? {
        ...report,
        label: shareData?.reportLabel ?? report.label,
      }
    : undefined;

  // Apply simulation labels (positional, matches simulationIds order)
  // Since parallel queries may return in different order, we need to match by ID
  const simulations = fetchedSimulations.map((sim) => {
    const index = shareData?.simulationIds?.findIndex((id) => id === String(sim.id));
    const labelFromShare =
      index !== undefined && index >= 0 ? shareData?.simulationLabels?.[index] : null;
    return {
      ...sim,
      label: labelFromShare ?? sim.label,
    };
  });

  // Apply policy labels (positional, matches policyIds order)
  const policies = fetchedPolicies.map((policy) => {
    const index = shareData?.policyIds?.findIndex((id) => id === String(policy.id));
    const labelFromShare =
      index !== undefined && index >= 0 ? shareData?.policyLabels?.[index] : null;
    return {
      ...policy,
      label: labelFromShare ?? policy.label,
    };
  });

  // Households - keep as-is (label is on user association, not base ingredient)
  const households = fetchedHouseholds;

  // Apply geography label
  const geographies = fetchedGeographies.map((geo) => ({
    ...geo,
    name: shareData?.geographyLabel ?? geo.name,
  }));

  return {
    report: reportWithLabel,
    simulations,
    policies,
    households,
    geographies,
    isLoading,
    error,
  };
}
