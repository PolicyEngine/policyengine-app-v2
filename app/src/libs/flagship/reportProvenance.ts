/**
 * Where a report's provisions come from when the local stash is missing.
 *
 * `runFlagshipReport` stashes the provisions in localStorage under the
 * report id, which serves the browser that ran the report and nobody
 * else: a shared link, another device, or a cleared profile opens the
 * report with no provenance, and validation has nothing to match. The
 * reform policy on the PolicyEngine API carries the same parameter
 * changes, so they are rebuilt from it here, read in the report's year
 * as the run that stashed them described them.
 */
import { CURRENT_YEAR } from '@/constants';
import { provisionValueInYear } from '@/libs/draftReform';
import type { FlagshipReportMeta, RunReportProvision } from '@/libs/flagship/runReport';
import type { Policy } from '@/types/ingredients/Policy';
import { ValueIntervalCollection } from '@/types/subIngredients/valueInterval';
import { formatLabelParts, getHierarchicalLabels } from '@/utils/parameterLabels';
import { getCurrentValue } from '@/utils/parameterValues';

/** Current law for a parameter on 1 January of `year`; today's value before its first date. */
function currentLawIn(values: Record<string, any> | undefined, year: string): unknown {
  if (!values) {
    return undefined;
  }
  return (
    new ValueIntervalCollection(values).getValueAtDate(`${year}-01-01`) ?? getCurrentValue(values)
  );
}

/**
 * Rebuilds report provisions from a policy's parameter changes. Each
 * keeps every dated value the policy sets, so a recompute or an edit
 * runs the same reform; its value and current law are those of the
 * report's year.
 */
export function provisionsFromPolicy(
  policy: Policy | null | undefined,
  parameters: Record<string, any> | null | undefined,
  year: string = CURRENT_YEAR
): RunReportProvision[] {
  return (policy?.parameters ?? []).map((parameter) => {
    const metadata = parameters?.[parameter.name];
    const baselineValue = currentLawIn(metadata?.values, year);
    const intervals = parameter.values.length > 0 ? parameter.values : undefined;
    const inYear = intervals
      ? provisionValueInYear({ value: undefined, intervals }, Number(year))
      : null;
    return {
      path: parameter.name,
      breadcrumb: metadata
        ? formatLabelParts(getHierarchicalLabels(parameter.name, parameters!))
        : parameter.name,
      unit: metadata?.unit ?? null,
      baselineValue,
      // A year the policy does not reach keeps current law.
      value: inYear ?? baselineValue,
      ...(intervals && { intervals }),
    };
  });
}

/**
 * Provenance for a report opened without its local stash: the reform
 * policy's changes as provisions in the report's year, the report's own
 * label as title.
 */
export function provenanceFromPolicy(
  policy: Policy | null | undefined,
  parameters: Record<string, any> | null | undefined,
  label: string | null | undefined,
  year: string = CURRENT_YEAR
): FlagshipReportMeta | null {
  if (!policy) {
    return null;
  }
  return {
    title: label || policy.label || '',
    sourceNote: '',
    provisions: provisionsFromPolicy(policy, parameters, year),
    createdAt: '',
  };
}
