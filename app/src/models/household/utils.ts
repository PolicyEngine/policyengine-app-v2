import { countryIds, type CountryId } from '@/libs/countries';
import type { HouseholdFieldValue, HouseholdScalar, HouseholdYearValueMap } from './appTypes';

export type HouseholdFieldMap = Record<string, HouseholdFieldValue>;

export function cloneValue<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function normalizeCountryId(countryId: string): CountryId {
  if (!countryIds.includes(countryId as CountryId)) {
    throw new Error(`Unknown country_id "${countryId}". Expected one of: ${countryIds.join(', ')}`);
  }
  return countryId as CountryId;
}

export function isHouseholdScalar(value: unknown): value is HouseholdScalar {
  return value === null || ['string', 'number', 'boolean'].includes(typeof value);
}

export function camelToSnake(value: string): string {
  return value.replace(/([A-Z])/g, '_$1').toLowerCase();
}

export function snakeToCamel(value: string): string {
  return value.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

export function isYearKey(value: string): boolean {
  return /^\d{4}$/.test(value);
}

export function isYearValueMap(value: unknown): value is HouseholdYearValueMap {
  if (!isRecord(value)) {
    return false;
  }

  const keys = Object.keys(value);
  return keys.length > 0 && keys.every(isYearKey) && Object.values(value).every(isHouseholdScalar);
}

export function normalizeHouseholdFieldValue(value: unknown, context: string): HouseholdFieldValue {
  if (isHouseholdScalar(value)) {
    return value;
  }

  if (isYearValueMap(value)) {
    return cloneValue(value);
  }

  throw new Error(`${context} must be a scalar or year-keyed scalar map`);
}

export function normalizeHouseholdFieldMap(values: unknown, context: string): HouseholdFieldMap {
  if (!isRecord(values)) {
    throw new Error(`${context} must be an object`);
  }

  return Object.fromEntries(
    Object.entries(values)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, normalizeHouseholdFieldValue(value, `${context}.${key}`)])
  );
}

export function inferYearFromData(value: unknown): number | null {
  const years = new Set<number>();

  const visit = (nested: unknown) => {
    if (Array.isArray(nested)) {
      nested.forEach(visit);
      return;
    }

    if (!isRecord(nested)) {
      return;
    }

    const keys = Object.keys(nested);
    if (keys.length > 0 && keys.every(isYearKey)) {
      keys.forEach((key) => years.add(Number(key)));
      return;
    }

    Object.values(nested).forEach(visit);
  };

  visit(value);
  return years.size > 0 ? Math.max(...years) : null;
}

function selectYearValue(
  value: Record<string, HouseholdScalar>,
  preferredYear: number | null
): HouseholdScalar {
  if (preferredYear !== null && String(preferredYear) in value) {
    return value[String(preferredYear)];
  }

  const sortedKeys = Object.keys(value).sort();
  return value[sortedKeys[sortedKeys.length - 1]];
}

export function flattenForYear(
  value: HouseholdFieldValue,
  preferredYear: number | null
): HouseholdScalar {
  if (isYearValueMap(value)) {
    return selectYearValue(value, preferredYear);
  }
  return value;
}

export function wrapForYear(value: HouseholdScalar, year: number): HouseholdYearValueMap {
  return { [String(year)]: value };
}

export function flattenEntityValues(
  values: HouseholdFieldMap,
  preferredYear: number | null
): Record<string, HouseholdScalar> {
  const flattened: Record<string, HouseholdScalar> = {};

  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) {
      continue;
    }
    flattened[key] = flattenForYear(value, preferredYear);
  }

  return flattened;
}

export function wrapEntityValuesForYear(
  values: Record<string, unknown>,
  year: number
): HouseholdFieldMap {
  const wrapped: HouseholdFieldMap = {};

  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) {
      continue;
    }

    const normalizedValue = normalizeHouseholdFieldValue(
      value,
      `Year-wrapped entity field "${key}"`
    );
    wrapped[key] = isYearValueMap(normalizedValue)
      ? normalizedValue
      : wrapForYear(normalizedValue, year);
  }

  return wrapped;
}

export function omitRecordKeys(
  record: Record<string, unknown>,
  omittedKeys: Iterable<string>
): Record<string, unknown> {
  const omitted = new Set(omittedKeys);

  return Object.fromEntries(
    Object.entries(record).filter(([key, value]) => !omitted.has(key) && value !== undefined)
  );
}

export function sortRecordKeysRecursively(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortRecordKeysRecursively);
  }

  if (!isRecord(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
      .map(([key, nestedValue]) => [key, sortRecordKeysRecursively(nestedValue)])
  );
}

export function deepEqual(left: unknown, right: unknown): boolean {
  if (left === right) {
    return true;
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    if (left.length !== right.length) {
      return false;
    }

    return left.every((entry, index) => deepEqual(entry, right[index]));
  }

  if (isRecord(left) && isRecord(right)) {
    const leftKeys = Object.keys(left).sort();
    const rightKeys = Object.keys(right).sort();

    if (!deepEqual(leftKeys, rightKeys)) {
      return false;
    }

    return leftKeys.every((key) => deepEqual(left[key], right[key]));
  }

  return false;
}
