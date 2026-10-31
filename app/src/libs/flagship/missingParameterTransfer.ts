import { parametersFromPolicyJson } from '@/api/reformStore';
import { policyMissingParameters } from '@/libs/flagship/missingParameters';
import type { RunReportBaseline, RunReportProvision } from '@/libs/flagship/runReport';
import type { ParameterMetadataCollection } from '@/types/metadata/parameterMetadata';
import type { V1PolicyContent } from '@/types/metadata/policyMetadata';
import type { Parameter } from '@/types/subIngredients/parameter';

/**
 * Moving a saved reform or report onto a new policy without the parameters
 * the model no longer has, as the old app's "Transfer parameters" did. The
 * other changes are kept as they are.
 */

/** A reform's changes without the parameters the model no longer has. */
export function parametersWithout(
  parameters: Parameter[],
  missingParameters: string[]
): Parameter[] {
  const missing = new Set(missingParameters);
  return parameters.filter((parameter) => !missing.has(parameter.name));
}

/** A report's provisions without the parameters the model no longer has. */
export function provisionsWithout(
  provisions: RunReportProvision[],
  missingParameters: string[]
): RunReportProvision[] {
  const missing = new Set(missingParameters);
  return provisions.filter((provision) => !missing.has(provision.path));
}

/**
 * What a report is compared with, without the parameters the model no
 * longer has. A baseline policy that sets none of them is kept as it is;
 * otherwise its other parameters are what the run makes the new baseline
 * policy from. Null when nothing would remain: the run would then compare
 * with current law under the saved reform's name. Rejects when the
 * baseline policy cannot be read.
 */
export async function baselineWithout(
  baseline: RunReportBaseline,
  missingParameters: string[],
  readPolicy: (policyId: string) => Promise<V1PolicyContent>,
  parameterMetadata?: ParameterMetadataCollection | null
): Promise<RunReportBaseline | null> {
  if (baseline.policyId === undefined) {
    const parameters = parametersWithout(baseline.parameters ?? [], missingParameters);
    return parameters.length > 0 ? { ...baseline, parameters } : null;
  }
  const policy = await readPolicy(String(baseline.policyId));
  const policyMissing = policyMissingParameters(policy);
  if (policyMissing.length === 0) {
    return baseline;
  }
  const parameters = parametersWithout(
    parametersFromPolicyJson(policy.policy_json, parameterMetadata),
    policyMissing
  );
  return parameters.length > 0
    ? { reformId: baseline.reformId, label: baseline.label, parameters }
    : null;
}
