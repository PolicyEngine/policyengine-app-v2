/**
 * Where a report's provisions come from when the local stash is missing.
 *
 * `runFlagshipReport` stashes the provisions in localStorage under the
 * report id, which serves the browser that ran the report and nobody
 * else: a shared link, another device, or a cleared profile opens the
 * report with no provenance, and validation has nothing to match. The
 * reform policy on the PolicyEngine API carries the same parameter
 * changes, so they are rebuilt from it here.
 */
import { CURRENT_YEAR } from '@/constants';
import type { FlagshipReportMeta, RunReportProvision } from '@/libs/flagship/runReport';
import type { Policy } from '@/types/ingredients/Policy';
import type { Parameter } from '@/types/subIngredients/parameter';
import { formatLabelParts, getHierarchicalLabels } from '@/utils/parameterLabels';
import { getCurrentValue } from '@/utils/parameterValues';
import { getParameterValueAtDate } from '@/utils/policyParameterUpdate';

/** The value a parameter's intervals set for `year`; the first interval when none covers it. */
export function valueForYear(parameter: Parameter, year: string = CURRENT_YEAR): unknown {
  return getParameterValueAtDate(parameter, `${year}-01-01`);
}

/** Rebuilds report provisions from a policy's parameter changes. */
export function provisionsFromPolicy(
  policy: Policy | null | undefined,
  parameters: Record<string, any> | null | undefined
): RunReportProvision[] {
  return (policy?.parameters ?? []).map((parameter) => {
    const metadata = parameters?.[parameter.name];
    return {
      path: parameter.name,
      breadcrumb: metadata
        ? formatLabelParts(getHierarchicalLabels(parameter.name, parameters!))
        : parameter.name,
      unit: metadata?.unit ?? null,
      baselineValue: getCurrentValue(metadata?.values),
      values: parameter.values.map((interval) => ({ ...interval })),
    };
  });
}

/**
 * Provenance for a report opened without its local stash: the reform
 * policy's changes as provisions, the report's own label as title.
 */
export function provenanceFromPolicy(
  policy: Policy | null | undefined,
  parameters: Record<string, any> | null | undefined,
  label: string | null | undefined
): FlagshipReportMeta | null {
  if (!policy) {
    return null;
  }
  return {
    title: label || policy.label || '',
    sourceNote: '',
    provisions: provisionsFromPolicy(policy, parameters),
    createdAt: '',
  };
}
