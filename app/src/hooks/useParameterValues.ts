import { useQuery } from "@tanstack/react-query";
import { fetchParameterValues } from "@/api/v2/parameterValues";
import { MetadataAdapter } from "@/adapters";
import { parameterValueKeys } from "@/libs/queryKeys";
import { ValuesList } from "@/types/subIngredients/valueInterval";

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

export { fetchParameterValues } from "@/api/v2/parameterValues";
