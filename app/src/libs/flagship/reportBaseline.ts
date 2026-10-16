import type {
  FlagshipReportMeta,
  RunReportBaseline,
  RunReportProvision,
} from '@/libs/flagship/runReport';
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

/** What a report compares with when its baseline policy could not be loaded. */
export const UNKNOWN_BASELINE_LABEL = 'a baseline policy that could not be loaded';

/**
 * Whether what the report compares with is unknown: no record of the
 * run's baseline (a shared link), and a baseline policy, not current
 * law, that failed to load. Read as current law, the report would claim
 * a comparison that it cannot show.
 */
export function reportBaselineUnknown(
  meta: Pick<FlagshipReportMeta, 'baseline'> | null | undefined,
  baselinePolicyId: string | undefined,
  { currentLawId, failedPolicyIds }: { currentLawId: number; failedPolicyIds: string[] }
): boolean {
  return (
    !meta?.baseline &&
    !!baselinePolicyId &&
    baselinePolicyId !== String(currentLawId) &&
    failedPolicyIds.includes(baselinePolicyId)
  );
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

/** A baseline that names a policy other than current law, or none. */
export function customBaseline(
  baseline: RunReportBaseline | undefined,
  currentLawId: number
): RunReportBaseline | undefined {
  if (!baseline) {
    return undefined;
  }
  if (baseline.policyId !== undefined) {
    return baseline.policyId === currentLawId ? undefined : baseline;
  }
  return baseline.parameters && baseline.parameters.length > 0 ? baseline : undefined;
}

/** A saved reform's parameters as the provisions its baseline policy is made from. */
export function baselineProvisions(
  baseline: Pick<RunReportBaseline, 'parameters'>
): Array<Pick<RunReportProvision, 'path' | 'value' | 'intervals'>> {
  return (baseline.parameters ?? []).map((parameter) => ({
    path: parameter.name,
    value: parameter.values[0]?.value,
    intervals: parameter.values,
  }));
}
