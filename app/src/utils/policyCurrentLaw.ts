import type { MetadataState } from '@/types/metadata';
import type { Parameter } from '@/types/subIngredients/parameter';
import type { ValueInterval, ValuesList } from '@/types/subIngredients/valueInterval';

export const POLICY_MATCHES_CURRENT_LAW_MESSAGE =
  'The selected values match current law, so there are no policy changes to save.';

type PolicyMetadataForComparison = Pick<
  MetadataState,
  'loading' | 'error' | 'currentCountry' | 'currentLawId' | 'version' | 'parameters'
>;

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

function intervalMatchesCurrentLaw(
  interval: ValueInterval,
  currentLawEntries: CurrentLawEntry[]
): boolean {
  if (
    !parseCalendarDate(interval.startDate) ||
    !parseCalendarDate(interval.endDate) ||
    interval.startDate > interval.endDate ||
    !getCurrentLawValue(currentLawEntries, interval.startDate)
  ) {
    return false;
  }

  const currentLawValuesInInterval = [
    getCurrentLawValue(currentLawEntries, interval.startDate)?.value,
    ...currentLawEntries
      .filter(
        (entry) => entry.startDate > interval.startDate && entry.startDate <= interval.endDate
      )
      .map((entry) => entry.value),
  ];

  return currentLawValuesInInterval.every((value) => policyValuesEqual(interval.value, value));
}

/**
 * Compare canonical policy parameter intervals with the current-law schedules in model metadata.
 * Returns true only when the policy contains proposed values and every proposed interval matches
 * current law throughout its covered dates. The proposed policy is never rewritten.
 */
export function isPolicyDuplicateOfCurrentLaw(
  parameters: Parameter[] | undefined,
  metadata: PolicyMetadataForComparison,
  countryId: string
): boolean {
  const parametersWithValues = (parameters ?? []).filter(
    (parameter) => parameter.values.length > 0
  );
  if (parametersWithValues.length === 0) {
    return false;
  }

  if (
    metadata.loading ||
    metadata.error ||
    metadata.currentCountry !== countryId ||
    !metadata.version ||
    metadata.currentLawId <= 0
  ) {
    return false;
  }

  return parametersWithValues.every((parameter) => {
    const currentLawEntries = getCurrentLawEntries(metadata.parameters[parameter.name]?.values);
    if (!currentLawEntries) {
      return false;
    }

    return parameter.values.every((interval) =>
      intervalMatchesCurrentLaw(interval, currentLawEntries)
    );
  });
}
