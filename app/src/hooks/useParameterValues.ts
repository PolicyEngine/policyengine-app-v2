import { useMemo } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import {
  fetchParameterValues,
  BASELINE_POLICY_ID,
} from "@/api/v2/parameterValues";
import { MetadataAdapter } from "@/adapters";
import { parameterValueKeys } from "@/libs/queryKeys";
import { ParameterMetadata } from "@/types/metadata";
import { ValuesList } from "@/types/subIngredients/valueInterval";

export { BASELINE_POLICY_ID } from "@/api/v2/parameterValues";

/**
 * Extract parameter IDs from parameter names using the parameters metadata.
 * Filters out any parameters that don't have an ID in the metadata.
 */
export function extractParameterIds(
  parameterNames: string[],
  parameters: Record<string, ParameterMetadata>
): string[] {
  return parameterNames
    .map((name) => parameters[name]?.id)
    .filter((id): id is string => !!id);
}

/**
 * Hook to fetch parameter values for a specific parameter and policy on-demand.
 *
 * All parameter values are stored separately and linked to a policy.
 * Both baseline (current law) and reform policies have their own sets of values.
 *
 * @param parameterId - The ID of the parameter to fetch values for
 * @param policyId - The ID of the policy to fetch values for
 * @param options.enabled - Whether to enable the query (default: true if both IDs provided)
 * @returns Query result with data as ValuesList (Record<startDate, value>)
 */
export function useParameterValues(
  parameterId: string | undefined,
  policyId: string | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: parameterValueKeys.byPolicyAndParameter(
      policyId ?? "",
      parameterId ?? ""
    ),
    queryFn: async (): Promise<ValuesList> => {
      if (!parameterId || !policyId) {
        return {};
      }
      const values = await fetchParameterValues(parameterId, policyId);
      return MetadataAdapter.parameterValuesFromV2(values);
    },
    enabled: options?.enabled ?? (!!parameterId && !!policyId),
    staleTime: 5 * 60 * 1000, // 5 minutes - parameter values don't change often
  });
}

/**
 * Hook to fetch parameter values for multiple parameters in parallel.
 *
 * Uses React Query's useQueries to run all requests concurrently.
 *
 * @param parameterIds - Array of parameter IDs to fetch values for
 * @param policyId - The ID of the policy (or "baseline" for current law)
 * @param options.enabled - Whether to enable the queries
 * @returns Object with:
 *   - data: Record<parameterId, ValuesList> mapping parameter IDs to their values
 *   - isLoading: true if any query is still loading
 *   - isError: true if any query has an error
 */
export function useMultipleParameterValues(
  parameterIds: string[],
  policyId: string | undefined,
  options?: { enabled?: boolean }
) {
  const queries = useQueries({
    queries: parameterIds.map((parameterId) => ({
      queryKey: parameterValueKeys.byPolicyAndParameter(policyId ?? "", parameterId),
      queryFn: async (): Promise<{ parameterId: string; values: ValuesList }> => {
        if (!policyId) {
          return { parameterId, values: {} };
        }
        const values = await fetchParameterValues(parameterId, policyId);
        return {
          parameterId,
          values: MetadataAdapter.parameterValuesFromV2(values),
        };
      },
      enabled: options?.enabled ?? !!policyId,
      staleTime: 5 * 60 * 1000,
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);
  const isError = queries.some((q) => q.isError);

  // Build the data map from successful queries
  const data: Record<string, ValuesList> = {};
  for (const query of queries) {
    if (query.data) {
      data[query.data.parameterId] = query.data.values;
    }
  }

  return {
    data,
    isLoading,
    isError,
  };
}

export { fetchParameterValues } from "@/api/v2/parameterValues";

/**
 * Result type for useBaselineValuesForParameters hook
 */
export interface BaselineValuesResult {
  /** Map of parameter ID to its baseline values */
  baselineValuesMap: Record<string, ValuesList>;
  /** Whether any values are still loading */
  isLoading: boolean;
  /** Whether any fetch encountered an error */
  isError: boolean;
}

/**
 * Hook to fetch baseline (current law) values for a list of parameters.
 *
 * This hook encapsulates the common pattern of:
 * 1. Converting parameter names to IDs
 * 2. Fetching baseline values for all parameters in parallel
 * 3. Returning the values in a map keyed by parameter ID
 *
 * @param parameterNames - Array of parameter names to fetch values for
 * @param parameters - Parameters metadata (from Redux store)
 * @returns BaselineValuesResult with the values map and loading state
 */
export function useBaselineValuesForParameters(
  parameterNames: string[],
  parameters: Record<string, ParameterMetadata>
): BaselineValuesResult {
  // Extract parameter IDs from names (memoized for hook stability)
  const parameterIds = useMemo(
    () => extractParameterIds(parameterNames, parameters),
    [parameterNames, parameters]
  );

  // Fetch baseline values for all parameters in parallel
  const { data, isLoading, isError } = useMultipleParameterValues(
    parameterIds,
    BASELINE_POLICY_ID,
    { enabled: parameterIds.length > 0 }
  );

  return {
    baselineValuesMap: data,
    isLoading,
    isError,
  };
}
