import type { QueryClient } from '@tanstack/react-query';
import { fetchPolicyById } from '@/api/policy';
import { fetchReportById } from '@/api/report';
import { fetchSimulationById } from '@/api/simulation';
import type { CountryId } from '@/libs/countries';
import { combinedMissingParameters } from '@/libs/flagship/missingParameters';
import { V1_POLICY_GC_TIME, v1PolicyKey } from '@/libs/queryKeys';
import type { PolicyMetadata, V1PolicyContent } from '@/types/metadata/policyMetadata';

/**
 * A v1 policy, with an empty parameter map when it stores none. v1
 * policies never change once created; `missing_parameters` changes only
 * when the API's model does.
 */
export async function fetchV1Policy(countryId: string, policyId: string): Promise<PolicyMetadata> {
  const policy = await fetchPolicyById(countryId, policyId);
  return { ...policy, policy_json: policy.policy_json ?? {} };
}

/**
 * A v1 policy through the query cache: read once per session, and shared
 * by the reform stores and the report page.
 */
export function readV1Policy(
  queryClient: QueryClient,
  countryId: string,
  policyId: string
): Promise<PolicyMetadata> {
  return queryClient.fetchQuery({
    queryKey: v1PolicyKey(countryId, policyId),
    queryFn: () => fetchV1Policy(countryId, policyId),
    staleTime: Infinity,
    gcTime: V1_POLICY_GC_TIME,
  });
}

/**
 * The parameters an existing v1 report's policies (its reform and its
 * baseline) set that the model no longer has. A re-run of the report runs
 * the same changes against the same baseline policy, so it checks these.
 * Rejects when the report or its simulations cannot be read.
 */
export async function reportMissingParameters(
  countryId: CountryId,
  apiReportId: string,
  readPolicy: (countryId: string, policyId: string) => Promise<V1PolicyContent>
): Promise<string[]> {
  const report = await fetchReportById(countryId, apiReportId);
  const simulationIds = [report.simulation_1_id, report.simulation_2_id].filter(
    (simulationId) => simulationId !== null && simulationId !== undefined
  );
  const simulations = await Promise.all(
    simulationIds.map((simulationId) => fetchSimulationById(countryId, String(simulationId)))
  );
  const policyIds = [
    ...new Set(
      simulations
        .map((simulation) => simulation.policy_id)
        .filter((policyId) => policyId !== null && policyId !== undefined)
        .map(String)
    ),
  ];
  // A policy that cannot be read says nothing; the others still count.
  const policies = await Promise.allSettled(
    policyIds.map((policyId) => readPolicy(countryId, policyId))
  );
  return combinedMissingParameters(
    policies.map((policy) => (policy.status === 'fulfilled' ? policy.value : undefined))
  );
}
