import type { MetadataState } from '@/types/metadata';
import type { Parameter } from '@/types/subIngredients/parameter';
import type { ValueInterval, ValuesList } from '@/types/subIngredients/valueInterval';

export const NO_EFFECTIVE_POLICY_CHANGES_MESSAGE =
  'The selected values match current law, so there are no policy changes to save.';
export const POLICY_COMPARISON_UNAVAILABLE_MESSAGE =
  'Current-law values are unavailable, so this policy cannot be saved yet.';

type PolicyMetadataForComparison = Pick<
  MetadataState,
  'loading' | 'error' | 'currentCountry' | 'currentLawId' | 'version' | 'parameters'
>;

export type PolicyCurrentLawEvaluation =
  | { status: 'metadata-unavailable'; parameters: [] }
  | { status: 'no-effective-changes'; parameters: [] }
  | { status: 'has-effective-changes'; parameters: Parameter[] };

interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

interface CurrentLawEntry {
  startDate: string;
  value: unknown;
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function getDaysInMonth(year: number, month: number): number {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function parseCalendarDate(value: string): CalendarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > getDaysInMonth(year, month)) {
    return null;
  }

  return { year, month, day };
}

function previousCalendarDate(value: string): string {
  const parsed = parseCalendarDate(value);
  if (!parsed) {
    throw new Error(`Invalid policy date: ${value}`);
  }

  let { year, month, day } = parsed;
  if (day > 1) {
    day -= 1;
  } else if (month > 1) {
    month -= 1;
    day = getDaysInMonth(year, month);
  } else {
    year -= 1;
    month = 12;
    day = 31;
  }

  if (year < 0) {
    throw new Error(`Policy date cannot precede 0000-01-01: ${value}`);
  }

  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function policyValuesEqual(left: unknown, right: unknown): boolean {
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

function getCurrentLawEntries(values: ValuesList | undefined): CurrentLawEntry[] | null {
  if (!values) {
    return null;
  }

  const entries = Object.entries(values);
  if (entries.length === 0 || entries.some(([startDate]) => !parseCalendarDate(startDate))) {
    return null;
  }

  return entries
    .map(([startDate, value]) => ({ startDate, value }))
    .sort((left, right) => left.startDate.localeCompare(right.startDate));
}

function getCurrentLawValue(entries: CurrentLawEntry[], date: string): CurrentLawEntry | null {
  let applicableEntry: CurrentLawEntry | null = null;

  for (const entry of entries) {
    if (entry.startDate > date) {
      break;
    }
    applicableEntry = entry;
  }

  return applicableEntry;
}

function evaluateInterval(
  interval: ValueInterval,
  currentLawEntries: CurrentLawEntry[]
): ValueInterval[] | null {
  if (
    !parseCalendarDate(interval.startDate) ||
    !parseCalendarDate(interval.endDate) ||
    interval.startDate > interval.endDate ||
    !getCurrentLawValue(currentLawEntries, interval.startDate)
  ) {
    return null;
  }

  const segmentStarts = [
    interval.startDate,
    ...currentLawEntries
      .map((entry) => entry.startDate)
      .filter((date) => date > interval.startDate && date <= interval.endDate),
  ];

  return segmentStarts.flatMap((segmentStart, index) => {
    const currentLaw = getCurrentLawValue(currentLawEntries, segmentStart);
    if (!currentLaw || policyValuesEqual(interval.value, currentLaw.value)) {
      return [];
    }

    const nextStart = segmentStarts[index + 1];
    return [
      {
        startDate: segmentStart,
        endDate: nextStart ? previousCalendarDate(nextStart) : interval.endDate,
        value: interval.value,
      },
    ];
  });
}

/**
 * Compare canonical policy parameter intervals with the current-law schedules in model metadata.
 * Matching portions are omitted from the returned parameters; unavailable or malformed metadata
 * prevents submission rather than guessing whether a proposed value changes current law.
 */
export function evaluatePolicyAgainstCurrentLaw(
  parameters: Parameter[] | undefined,
  metadata: PolicyMetadataForComparison,
  countryId: string
): PolicyCurrentLawEvaluation {
  const parametersWithValues = (parameters ?? []).filter(
    (parameter) => parameter.values.length > 0
  );
  if (parametersWithValues.length === 0) {
    return { status: 'no-effective-changes', parameters: [] };
  }

  if (
    metadata.loading ||
    metadata.error ||
    metadata.currentCountry !== countryId ||
    !metadata.version ||
    metadata.currentLawId <= 0
  ) {
    return { status: 'metadata-unavailable', parameters: [] };
  }

  const effectiveParameters: Parameter[] = [];
  for (const parameter of parametersWithValues) {
    const currentLawEntries = getCurrentLawEntries(metadata.parameters[parameter.name]?.values);
    if (!currentLawEntries) {
      return { status: 'metadata-unavailable', parameters: [] };
    }

    const effectiveIntervals: ValueInterval[] = [];
    for (const interval of parameter.values) {
      const evaluatedIntervals = evaluateInterval(interval, currentLawEntries);
      if (!evaluatedIntervals) {
        return { status: 'metadata-unavailable', parameters: [] };
      }
      effectiveIntervals.push(...evaluatedIntervals);
    }

    if (effectiveIntervals.length > 0) {
      effectiveParameters.push({ ...parameter, values: effectiveIntervals });
    }
  }

  return effectiveParameters.length > 0
    ? { status: 'has-effective-changes', parameters: effectiveParameters }
    : { status: 'no-effective-changes', parameters: [] };
}
