import type { FlagshipReportMeta, RunReportBaseline } from '@/libs/flagship/runReport';
import type { Policy } from '@/types/ingredients/Policy';

/**
 * What a report's results are compared with, by name: null for current
 * law. The run's own record names it; a shared link, which has no
 * record, reads the name of the baseline policy when it changes anything.
 * Reports run before a baseline could be chosen read as current law.
 */
export function reportBaselineLabel(
  meta: Pick<FlagshipReportMeta, 'baseline'> | null | undefined,
  baselinePolicy: Pick<Policy, 'label' | 'parameters'> | undefined
): string | null {
  if (meta?.baseline) {
    return meta.baseline.label;
  }
  return baselinePolicy?.parameters?.length
    ? baselinePolicy.label || 'Custom baseline policy'
    : null;
}

/**
 * What a new run from this report compares with: the same baseline
 * policy when it is not current law, so an adjusted report keeps its
 * comparison. Current law when unset.
 */
export function reportRunBaseline(
  meta: Pick<FlagshipReportMeta, 'baseline'> | null | undefined,
  baselinePolicyId: string | undefined,
  baselineLabel: string | null
): RunReportBaseline | undefined {
  if (!baselineLabel || !baselinePolicyId || !Number.isFinite(Number(baselinePolicyId))) {
    return undefined;
  }
  return {
    reformId: meta?.baseline?.reformId ?? null,
    label: baselineLabel,
    policyId: Number(baselinePolicyId),
  };
}
