import type { ParameterMetadataCollection } from '@/types/metadata/parameterMetadata';
import type { Parameter } from '@/types/subIngredients/parameter';
import type { ValueInterval, ValuesList } from '@/types/subIngredients/valueInterval';

export const NO_EFFECTIVE_POLICY_CHANGES_MESSAGE =
  'The selected values match current law, so there are no policy changes to save.';
export const NO_EFFECTIVE_PARAMETER_CHANGE_MESSAGE =
  'The selected value matches current law, so it was not added to the policy.';

export class NoEffectivePolicyChangesError extends Error {
  constructor(message: string = NO_EFFECTIVE_POLICY_CHANGES_MESSAGE) {
    super(message);
    this.name = 'NoEffectivePolicyChangesError';
  }
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

interface CurrentLawEntry {
  startDate: string;
  value: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Compare serialized PolicyEngine parameter values without coercion.
 *
 * Boolean false and numeric zero are distinct policy values. Arrays retain
 * their ordering, while object key order is not meaningful in JSON payloads.
 */
export function policyValuesEqual(left: unknown, right: unknown): boolean {
  if (left === right) {
    return true;
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    return (
      left.length === right.length &&
      left.every((entry, index) => policyValuesEqual(entry, right[index]))
    );
  }

  if (isRecord(left) && isRecord(right)) {
    const leftKeys = Object.keys(left).sort();
    const rightKeys = Object.keys(right).sort();

    return (
      policyValuesEqual(leftKeys, rightKeys) &&
      leftKeys.every((key) => policyValuesEqual(left[key], right[key]))
    );
  }

  return false;
}

function isValidIsoDate(date: string): boolean {
  if (!ISO_DATE_PATTERN.test(date)) {
    return false;
  }

  const [year, month, day] = date.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

function shiftIsoDate(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

function getCurrentLawEntries(values: ValuesList | undefined): CurrentLawEntry[] {
  if (!values) {
    return [];
  }

  return Object.entries(values)
    .filter(([startDate]) => isValidIsoDate(startDate))
    .map(([startDate, value]) => ({ startDate, value }))
    .sort((left, right) => left.startDate.localeCompare(right.startDate));
}

function getCurrentLawValue(
  entries: CurrentLawEntry[],
  date: string
): { found: boolean; value: unknown } {
  let found = false;
  let value: unknown;

  for (const entry of entries) {
    if (entry.startDate > date) {
      break;
    }
    found = true;
    value = entry.value;
  }

  return { found, value };
}

function mergeAdjacentIntervals(intervals: ValueInterval[]): ValueInterval[] {
  const sorted = intervals
    .map((interval) => ({ ...interval }))
    .sort((left, right) => left.startDate.localeCompare(right.startDate));

  return sorted.reduce<ValueInterval[]>((merged, interval) => {
    const previous = merged.at(-1);
    if (!previous || !isValidIsoDate(previous.endDate) || !isValidIsoDate(interval.startDate)) {
      merged.push(interval);
      return merged;
    }

    const isAdjacent = shiftIsoDate(previous.endDate, 1) === interval.startDate;
    if (isAdjacent && policyValuesEqual(previous.value, interval.value)) {
      previous.endDate = interval.endDate;
      return merged;
    }

    merged.push(interval);
    return merged;
  }, []);
}

/**
 * Remove the portions of proposed intervals that already match current law.
 *
 * PolicyEngine date ranges are inclusive. A proposal is split at each
 * current-law effective date so a range that initially matches current law
 * can still retain a later, effective change. Dates without an applicable
 * current-law value are preserved because they cannot safely be classified
 * as redundant.
 */
export function normalizeParameterIntervals(
  proposedIntervals: ValueInterval[],
  currentLawValues: ValuesList | undefined
): ValueInterval[] {
  const currentLawEntries = getCurrentLawEntries(currentLawValues);

  if (currentLawEntries.length === 0) {
    return proposedIntervals.map((interval) => ({ ...interval }));
  }

  const effectiveIntervals = proposedIntervals.flatMap((interval) => {
    if (
      !isValidIsoDate(interval.startDate) ||
      !isValidIsoDate(interval.endDate) ||
      interval.startDate > interval.endDate
    ) {
      return [{ ...interval }];
    }

    const segmentStarts = [
      interval.startDate,
      ...currentLawEntries
        .map((entry) => entry.startDate)
        .filter((date) => date > interval.startDate && date <= interval.endDate),
    ];

    return segmentStarts.flatMap((segmentStart, index) => {
      const nextStart = segmentStarts[index + 1];
      const segmentEnd = nextStart ? shiftIsoDate(nextStart, -1) : interval.endDate;
      const currentLaw = getCurrentLawValue(currentLawEntries, segmentStart);

      if (currentLaw.found && policyValuesEqual(interval.value, currentLaw.value)) {
        return [];
      }

      return [{ startDate: segmentStart, endDate: segmentEnd, value: interval.value }];
    });
  });

  return mergeAdjacentIntervals(effectiveIntervals);
}

/** Return only policy parameter intervals that differ from current law. */
export function normalizePolicyParameters(
  parameters: Parameter[] | undefined,
  currentLawMetadata: ParameterMetadataCollection
): Parameter[] {
  if (!parameters) {
    return [];
  }

  return parameters.flatMap((parameter) => {
    const values = normalizeParameterIntervals(
      parameter.values,
      currentLawMetadata[parameter.name]?.values
    );

    return values.length > 0 ? [{ ...parameter, values }] : [];
  });
}

/** Whether a proposed policy contains at least one effective change. */
export function hasEffectivePolicyChanges(
  parameters: Parameter[] | undefined,
  currentLawMetadata: ParameterMetadataCollection
): boolean {
  return normalizePolicyParameters(parameters, currentLawMetadata).some(
    (parameter) => parameter.values.length > 0
  );
}

/** Normalize a policy and reject it when every proposed interval is redundant. */
export function requireEffectivePolicyParameters(
  parameters: Parameter[] | undefined,
  currentLawMetadata: ParameterMetadataCollection
): Parameter[] {
  const effectiveParameters = normalizePolicyParameters(parameters, currentLawMetadata);

  if (effectiveParameters.length === 0) {
    throw new NoEffectivePolicyChangesError();
  }

  return effectiveParameters;
}
