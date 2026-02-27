/**
 * Hook for fetching complete report data via a single API call.
 *
 * Replaces the 8+ parallel queries in useUserReportById with a single
 * GET /reports/{report_id}/full call, then maps the response into the
 * same shape that ReportOutput.page.tsx expects.
 *
 * This hook is designed for v2 economy reports where the reportId is
 * a v2 API UUID. For v1 reports, useUserReportById is still used.
 */

import { useQuery } from '@tanstack/react-query';
import { PolicyAdapter } from '@/adapters';
import { fetchReportFull, ReportFullResponse } from '@/api/v2/reportFull';
import { Geography } from '@/types/ingredients/Geography';
import { Household } from '@/types/ingredients/Household';
import { Policy } from '@/types/ingredients/Policy';
import { Report } from '@/types/ingredients/Report';
import { Simulation } from '@/types/ingredients/Simulation';
import { UserReport } from '@/types/ingredients/UserReport';

function mapReportStatus(status: string): Report['status'] {
  switch (status) {
    case 'completed':
      return 'complete';
    case 'failed':
      return 'error';
    default:
      return 'pending';
  }
}

function mapFullResponse(
  fullResponse: ReportFullResponse,
  userReport: UserReport
): {
  report: Report;
  simulations: Simulation[];
  policies: Policy[];
  households: Household[];
  geographies: Geography[];
} {
  const { report: apiReport } = fullResponse;

  // Build simulation IDs list
  const simulationIds: string[] = [];
  if (fullResponse.baseline_simulation) {
    simulationIds.push(fullResponse.baseline_simulation.id);
  }
  if (fullResponse.reform_simulation) {
    simulationIds.push(fullResponse.reform_simulation.id);
  }

  // Determine output type from report_type
  const isEconomy = apiReport.report_type?.includes('economy') ?? false;
  const isHousehold = apiReport.report_type?.includes('household') ?? false;
  const outputType: 'household' | 'economy' | undefined = isHousehold
    ? 'household'
    : isEconomy
      ? 'economy'
      : userReport.outputType;

  // Build app Report with results embedded
  const report: Report = {
    id: apiReport.id,
    countryId: userReport.countryId,
    year: userReport.year || new Date().getFullYear().toString(),
    apiVersion: 'v2',
    simulationIds,
    status: mapReportStatus(apiReport.status),
    outputType,
    output: fullResponse.economic_impact ?? null,
  };

  // Build simulations
  const simulations: Simulation[] = [];

  if (fullResponse.baseline_simulation) {
    simulations.push({
      id: fullResponse.baseline_simulation.id,
      policyId: null, // baseline = current law
      populationId: fullResponse.household?.id ?? fullResponse.region?.code,
      populationType: fullResponse.household ? 'household' : 'geography',
      label: null,
      isCreated: true,
    });
  }

  if (fullResponse.reform_simulation) {
    simulations.push({
      id: fullResponse.reform_simulation.id,
      policyId: fullResponse.reform_policy?.id ?? null,
      populationId: fullResponse.household?.id ?? fullResponse.region?.code,
      populationType: fullResponse.household ? 'household' : 'geography',
      label: null,
      isCreated: true,
    });
  }

  // Build policies array: [baseline, reform]
  // Baseline is current law (policy_id=null on the simulation), so when the
  // API returns baseline_policy=null we represent it as id:null with no params.
  const policies: Policy[] = [];
  if (fullResponse.baseline_policy) {
    policies.push(PolicyAdapter.fromV2Response(fullResponse.baseline_policy));
  } else {
    policies.push({ id: null, parameters: [] });
  }
  if (fullResponse.reform_policy) {
    policies.push(PolicyAdapter.fromV2Response(fullResponse.reform_policy));
  }

  // Build households
  const households: Household[] = [];
  if (fullResponse.household) {
    const h = fullResponse.household;
    households.push({
      id: h.id,
      year: h.year,
      tax_benefit_model_name: h.tax_benefit_model_name as Household['tax_benefit_model_name'],
      people: h.people as Household['people'],
      tax_unit: h.tax_unit ?? undefined,
      family: h.family ?? undefined,
      spm_unit: h.spm_unit ?? undefined,
      marital_unit: h.marital_unit ?? undefined,
      household: h.household ?? undefined,
      benunit: h.benunit ?? undefined,
    });
  }

  // Build geographies
  const geographies: Geography[] = [];
  if (fullResponse.region) {
    geographies.push({
      countryId: userReport.countryId,
      regionCode: fullResponse.region.code,
    });
  }

  return { report, simulations, policies, households, geographies };
}

/**
 * Fetch complete report data via a single API call.
 *
 * @param reportId - The v2 API report UUID
 * @param userReport - The UserReport from localStorage (provides countryId, year, etc.)
 * @param options - Query options (enabled, etc.)
 */
export function useReportFull(
  reportId: string | undefined,
  userReport: UserReport | undefined,
  options?: { enabled?: boolean }
) {
  const isEnabled = options?.enabled !== false && !!reportId;

  const query = useQuery({
    queryKey: ['report-full', reportId],
    queryFn: () => fetchReportFull(reportId!),
    enabled: isEnabled,
    staleTime: 30 * 1000, // 30 seconds — results may update as computation completes
  });

  if (!query.data || !userReport) {
    return {
      report: undefined,
      simulations: [] as Simulation[],
      policies: [] as Policy[],
      households: [] as Household[],
      geographies: [] as Geography[],
      isLoading: query.isLoading,
      error: query.error,
    };
  }

  const mapped = mapFullResponse(query.data, userReport);

  return {
    ...mapped,
    isLoading: false,
    error: null,
  };
}
