import type { SimulationStateProps } from '@/types/pathwayState';
import type { Parameter } from '@/types/subIngredients/parameter';
import {
  hasRequiredPolicyMetadata,
  normalizePolicyParameters,
  policyParametersEqual,
  type PolicyMetadataReadinessState,
} from '@/utils/policyCurrentLaw';
import { isCurrentLaw } from '../currentLaw';

export const REPORT_REQUIRES_POLICY_CHANGE_MESSAGE =
  'A report needs an effective policy change. Choose a policy that differs from current law.';
export const REPORT_POLICIES_IDENTICAL_MESSAGE =
  'A comparison report needs different policy configurations. Choose policies with different effective values.';
export const REPORT_POLICY_LOADING_MESSAGE =
  'Policy details are still loading. Wait a moment before running the report.';

export type ReportPolicyActionabilityReason =
  | 'policy-data-unavailable'
  | 'no-effective-policy-change'
  | 'identical-policy-configurations';

export interface ReportPolicyActionability {
  isActionable: boolean;
  reason: ReportPolicyActionabilityReason | null;
  message: string | null;
  normalizedPolicies: Parameter[][];
}

interface GetReportPolicyActionabilityArgs {
  simulations: SimulationStateProps[];
  metadata: PolicyMetadataReadinessState;
  countryId: string;
}

function isResolvedParameter(parameter: Parameter): boolean {
  return (
    typeof parameter?.name === 'string' &&
    parameter.name.length > 0 &&
    Array.isArray(parameter.values)
  );
}

/** Determine whether a report will compare materially different policy rules. */
export function getReportPolicyActionability({
  simulations,
  metadata,
  countryId,
}: GetReportPolicyActionabilityArgs): ReportPolicyActionability {
  const unavailable = (): ReportPolicyActionability => ({
    isActionable: false,
    reason: 'policy-data-unavailable',
    message: REPORT_POLICY_LOADING_MESSAGE,
    normalizedPolicies: [],
  });

  if (!hasRequiredPolicyMetadata(metadata, countryId, []) || simulations.length === 0) {
    return unavailable();
  }

  const normalizedPolicies: Parameter[][] = [];
  for (const { policy } of simulations) {
    if (!policy.id) {
      return unavailable();
    }
    if (isCurrentLaw(policy.id)) {
      normalizedPolicies.push([]);
      continue;
    }
    if (
      !policy.parameters.every(isResolvedParameter) ||
      !hasRequiredPolicyMetadata(metadata, countryId, policy.parameters)
    ) {
      return unavailable();
    }
    normalizedPolicies.push(normalizePolicyParameters(policy.parameters, metadata.parameters));
  }

  if (normalizedPolicies.length === 1) {
    const isActionable = normalizedPolicies[0].length > 0;
    return {
      isActionable,
      reason: isActionable ? null : 'no-effective-policy-change',
      message: isActionable ? null : REPORT_REQUIRES_POLICY_CHANGE_MESSAGE,
      normalizedPolicies,
    };
  }

  const policiesDiffer = normalizedPolicies.some(
    (policy, index) => index > 0 && !policyParametersEqual(normalizedPolicies[0], policy)
  );
  return {
    isActionable: policiesDiffer,
    reason: policiesDiffer ? null : 'identical-policy-configurations',
    message: policiesDiffer ? null : REPORT_POLICIES_IDENTICAL_MESSAGE,
    normalizedPolicies,
  };
}
