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
import { provisionsForYear } from '@/libs/draftReform';
import type { FlagshipReportMeta, RunReportProvision } from '@/libs/flagship/runReport';
import type { Policy } from '@/types/ingredients/Policy';
import { ValueIntervalCollection } from '@/types/subIngredients/valueInterval';
import { formatLabelParts, getHierarchicalLabels } from '@/utils/parameterLabels';
import { getCurrentValue } from '@/utils/parameterValues';

/**
 * Rebuilds report provisions from a policy's parameter changes, as they
 * stand in the report's year: current law then, the reform's value then,
 * and the reform's own dates. The browser that ran the report stashes
 * the same through `provisionsForYear`.
 */
export function provisionsFromPolicy(
  policy: Policy | null | undefined,
  parameters: Record<string, any> | null | undefined,
  year: string = CURRENT_YEAR
): RunReportProvision[] {
  const reportYear = Number(year) || Number(CURRENT_YEAR);
  /** Current law on 1 January of a year; today's value when its dates cannot tell. */
  const currentLawAt = (path: string, at: number) => {
    const values = parameters?.[path]?.values;
    return values
      ? (new ValueIntervalCollection(values).getValueAtDate(`${at}-01-01`) ??
          getCurrentValue(values))
      : undefined;
  };
  const provisions = (policy?.parameters ?? []).map((parameter) => {
    const metadata = parameters?.[parameter.name];
    // The dates in order, as the report's dated reasons read them.
    const intervals = [...(parameter.values ?? [])].sort((a, b) =>
      a.startDate.localeCompare(b.startDate)
    );
    return {
      path: parameter.name,
      breadcrumb: metadata
        ? formatLabelParts(getHierarchicalLabels(parameter.name, parameters!))
        : parameter.name,
      unit: metadata?.unit ?? null,
      baselineValue: getCurrentValue(metadata?.values),
      value: intervals[0]?.value,
      ...(intervals.length > 0 && { intervals }),
    };
  });
  return provisionsForYear(provisions, reportYear, currentLawAt);
}

/**
 * Provenance for a report opened without its local stash: the reform
 * policy's changes as provisions, the report's own label as title.
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
