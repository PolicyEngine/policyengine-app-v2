import { deepEqual } from '@/models/household/utils';
import type { PopulationStateProps } from '@/types/pathwayState';

/** Shared population behavior requires the same identity and full input content. */
export function arePopulationsEqual(
  baseline: PopulationStateProps | undefined,
  reform: PopulationStateProps | undefined
): boolean {
  if (!baseline || !reform) {
    return false;
  }
  return deepEqual(
    { ...baseline, household: baseline.household?.toJSON() ?? null },
    { ...reform, household: reform.household?.toJSON() ?? null }
  );
}
