import type { MetadataState } from '@/types/metadata';
import type { ParameterMetadataCollection } from '@/types/metadata/parameterMetadata';
import type { Parameter } from '@/types/subIngredients/parameter';
import type { ValueInterval, ValuesList } from '@/types/subIngredients/valueInterval';
import { compareISODateStrings, isValidISODateString, shiftISODate } from '@/utils/dateUtils';

export const NO_EFFECTIVE_POLICY_CHANGES_MESSAGE =
  'The selected values match current law, so there are no policy changes to save.';
export const NO_EFFECTIVE_PARAMETER_CHANGE_MESSAGE =
  'The selected value matches current law, so it was not added to the policy.';
export const POLICY_METADATA_LOADING_MESSAGE =
  'Policy details are still loading. Wait a moment before saving or running this reform.';

export class NoEffectivePolicyChangesError extends Error {
  constructor(message: string = NO_EFFECTIVE_POLICY_CHANGES_MESSAGE) {
    super(message);
    this.name = 'NoEffectivePolicyChangesError';
  }
}

interface CurrentLawEntry {
  startDate: string;
  value: unknown;
}

export type PolicyMetadataReadinessState = Pick<
  MetadataState,
  'loading' | 'error' | 'currentCountry' | 'currentLawId' | 'version' | 'parameters'
>;

/**
 * Whether current model metadata can safely classify every proposed parameter
 * against current law. Callers must fail closed when this returns false.
 */
export function hasRequiredPolicyMetadata(
  metadata: PolicyMetadataReadinessState,
  countryId: string,
  parameters: Parameter[] | undefined
): boolean {
  return (
    !metadata.loading &&
    !metadata.error &&
    metadata.currentCountry === countryId &&
    Boolean(metadata.version) &&
    metadata.currentLawId > 0 &&
    (parameters ?? []).every((parameter) => {
      const currentLawEntries = getCurrentLawEntries(metadata.parameters[parameter.name]?.values);

      return (
        currentLawEntries.length > 0 &&
        parameter.values.every(
          (interval) =>
            isValidISODateString(interval.startDate) &&
            isValidISODateString(interval.endDate) &&
            compareISODateStrings(interval.startDate, interval.endDate) <= 0 &&
            getCurrentLawValue(currentLawEntries, interval.startDate).found
        )
      );
    })
  );
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

function getCurrentLawEntries(values: ValuesList | undefined): CurrentLawEntry[] {
  if (!values) {
    return [];
  }

  return Object.entries(values)
    .filter(([startDate]) => isValidISODateString(startDate))
    .map(([startDate, value]) => ({ startDate, value }))
    .sort((left, right) => compareISODateStrings(left.startDate, right.startDate));
}

function getCurrentLawValue(
  entries: CurrentLawEntry[],
  date: string
): { found: boolean; value: unknown } {
  let found = false;
  let value: unknown;

  for (const entry of entries) {
    if (compareISODateStrings(entry.startDate, date) > 0) {
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
    .sort((left, right) => compareISODateStrings(left.startDate, right.startDate));

  return sorted.reduce<ValueInterval[]>((merged, interval) => {
    const previous = merged.at(-1);
    if (
      !previous ||
      !isValidISODateString(previous.endDate) ||
      !isValidISODateString(interval.startDate)
    ) {
      merged.push(interval);
      return merged;
    }

    const isAdjacent = shiftISODate(previous.endDate, 1) === interval.startDate;
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
      !isValidISODateString(interval.startDate) ||
      !isValidISODateString(interval.endDate) ||
      compareISODateStrings(interval.startDate, interval.endDate) > 0
    ) {
      return [{ ...interval }];
    }

    const segmentStarts = [
      interval.startDate,
      ...currentLawEntries
        .map((entry) => entry.startDate)
        .filter(
          (date) =>
            compareISODateStrings(date, interval.startDate) > 0 &&
            compareISODateStrings(date, interval.endDate) <= 0
        ),
    ];

    return segmentStarts.flatMap((segmentStart, index) => {
      const nextStart = segmentStarts[index + 1];
      const segmentEnd = nextStart ? shiftISODate(nextStart, -1) : interval.endDate;
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

function canonicalizePolicyParameters(parameters: Parameter[]): Parameter[] {
  const valuesByName = new Map<string, ValueInterval[]>();

  for (const parameter of parameters) {
    valuesByName.set(parameter.name, [
      ...(valuesByName.get(parameter.name) ?? []),
      ...parameter.values,
    ]);
  }

  return [...valuesByName.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, values]) => ({
      name,
      values: mergeAdjacentIntervals(values).sort((left, right) => {
        const startComparison = compareISODateStrings(left.startDate, right.startDate);
        return startComparison || compareISODateStrings(left.endDate, right.endDate);
      }),
    }));
}

/** Compare normalized policy parameters without relying on IDs or insertion order. */
export function policyParametersEqual(left: Parameter[], right: Parameter[]): boolean {
  return policyValuesEqual(canonicalizePolicyParameters(left), canonicalizePolicyParameters(right));
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
