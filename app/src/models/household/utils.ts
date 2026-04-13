import { countryIds, type CountryId } from '@/libs/countries';
import type {
  CanonicalFieldMap,
  CanonicalFieldValue,
  CanonicalGroupSetup,
  CanonicalGroupSetupKey,
  CanonicalHouseholdSetup,
  CanonicalStructuredEntityValues,
  CanonicalStructuredHouseholdData,
  CanonicalStructuredHouseholdState,
  HouseholdScalar,
} from './canonicalTypes';
import { buildGeneratedGroupName, GROUP_DEFINITIONS, type HouseholdGroupAppKey } from './schema';

export const SETUP_KEY_BY_APP_KEY: Record<HouseholdGroupAppKey, CanonicalGroupSetupKey> = {
  households: 'household',
  families: 'family',
  taxUnits: 'taxUnit',
  spmUnits: 'spmUnit',
  maritalUnits: 'maritalUnit',
  benunits: 'benunit',
};

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

export function isYearValueMap(value: unknown): value is Record<string, HouseholdScalar> {
  if (!isRecord(value)) {
    return false;
  }

  const keys = Object.keys(value);
  return keys.length > 0 && keys.every(isYearKey) && Object.values(value).every(isHouseholdScalar);
}

export function normalizeCanonicalFieldValue(value: unknown, context: string): CanonicalFieldValue {
  if (isHouseholdScalar(value)) {
    return value;
  }

  if (isYearValueMap(value)) {
    return cloneValue(value);
  }

  throw new Error(`${context} must be a scalar or year-keyed scalar map`);
}

export function normalizeCanonicalFieldMap(values: unknown, context: string): CanonicalFieldMap {
  if (!isRecord(values)) {
    throw new Error(`${context} must be an object`);
  }

  return Object.fromEntries(
    Object.entries(values)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, normalizeCanonicalFieldValue(value, `${context}.${key}`)])
  );
}

export function getCanonicalGroupSetup(
  setup: CanonicalHouseholdSetup,
  appKey: HouseholdGroupAppKey
): CanonicalGroupSetup | undefined {
  return setup[SETUP_KEY_BY_APP_KEY[appKey]];
}

export function setCanonicalGroupSetup(
  setup: CanonicalHouseholdSetup,
  appKey: HouseholdGroupAppKey,
  group: CanonicalGroupSetup
): void {
  switch (appKey) {
    case 'households':
      setup.household = group;
      return;
    case 'families':
      setup.family = group;
      return;
    case 'taxUnits':
      setup.taxUnit = group;
      return;
    case 'spmUnits':
      setup.spmUnit = group;
      return;
    case 'maritalUnits':
      setup.maritalUnit = group;
      return;
    case 'benunits':
      setup.benunit = group;
  }
}

function normalizeCanonicalGroupSetup(args: {
  group: CanonicalGroupSetup;
  groupLabel: string;
  peopleNames: Set<string>;
}): CanonicalGroupSetup {
  if (!Array.isArray(args.group.members)) {
    throw new Error(`${args.groupLabel}.members must be an array`);
  }

  const members = args.group.members.map((member) => String(member));
  const unknownMembers = members.filter((member) => !args.peopleNames.has(member));

  if (unknownMembers.length > 0) {
    throw new Error(`${args.groupLabel} references unknown members: ${unknownMembers.join(', ')}`);
  }

  return {
    name:
      typeof args.group.name === 'string' && args.group.name.length > 0
        ? args.group.name
        : undefined,
    members,
    values: normalizeCanonicalFieldMap(args.group.values, `${args.groupLabel}.values`),
  };
}

export function normalizeCanonicalSetup(setup: CanonicalHouseholdSetup): CanonicalHouseholdSetup {
  if (!isRecord(setup.people)) {
    throw new Error('Canonical household setup requires a people object');
  }

  const people = Object.fromEntries(
    Object.entries(setup.people).map(([personName, person]) => {
      if (!isRecord(person) || !('values' in person)) {
        throw new Error(`Canonical household setup person "${personName}" is malformed`);
      }

      return [
        personName,
        {
          values: normalizeCanonicalFieldMap(
            (person as { values: unknown }).values,
            `Canonical household person "${personName}"`
          ),
        },
      ];
    })
  );

  const normalized: CanonicalHouseholdSetup = {
    countryId: normalizeCountryId(setup.countryId),
    label: setup.label ?? null,
    year: setup.year ?? null,
    people,
  };
  const peopleNames = new Set(Object.keys(people));

  for (const definition of GROUP_DEFINITIONS) {
    const group = getCanonicalGroupSetup(setup, definition.appKey);
    if (!group) {
      continue;
    }

    setCanonicalGroupSetup(
      normalized,
      definition.appKey,
      normalizeCanonicalGroupSetup({
        group,
        groupLabel: `Canonical household ${definition.appKey}`,
        peopleNames,
      })
    );
  }

  return normalized;
}

export function buildCanonicalSetupFromStructuredState(args: {
  countryId: CountryId;
  label: string | null;
  year: number | null;
  data: CanonicalStructuredHouseholdData;
}): CanonicalHouseholdSetup {
  const setup: CanonicalHouseholdSetup = {
    countryId: normalizeCountryId(args.countryId),
    label: args.label ?? null,
    year: args.year ?? inferYearFromData(args.data),
    people: Object.fromEntries(
      Object.entries(args.data.people).map(([personName, values]) => [
        personName,
        {
          values: normalizeCanonicalFieldMap(values, `Canonical household person "${personName}"`),
        },
      ])
    ),
  };
  const peopleNames = new Set(Object.keys(setup.people));

  for (const definition of GROUP_DEFINITIONS) {
    const group = args.data.groups[definition.appKey];
    if (!group) {
      continue;
    }

    setCanonicalGroupSetup(
      setup,
      definition.appKey,
      normalizeCanonicalGroupSetup({
        group: {
          name: group.name,
          members: group.members,
          values: group.values,
        },
        groupLabel: `Canonical household ${definition.appKey}`,
        peopleNames,
      })
    );
  }

  return normalizeCanonicalSetup(setup);
}

export function buildStructuredHouseholdDataFromCanonicalSetup(
  setup: CanonicalHouseholdSetup
): CanonicalStructuredHouseholdData {
  const normalizedSetup = normalizeCanonicalSetup(setup);
  const groups: CanonicalStructuredHouseholdData['groups'] = {};

  for (const definition of GROUP_DEFINITIONS) {
    const group = getCanonicalGroupSetup(normalizedSetup, definition.appKey);
    if (!group) {
      continue;
    }

    groups[definition.appKey] = {
      name: group.name ?? buildGeneratedGroupName(definition.generatedKeyPrefix, 0),
      members: cloneValue(group.members),
      values: cloneValue(group.values),
    };
  }

  return {
    people: Object.fromEntries(
      Object.entries(normalizedSetup.people).map(([personName, person]) => [
        personName,
        cloneValue(person.values),
      ])
    ),
    groups,
  };
}

export function buildStructuredStateFromCanonicalSetup(args: {
  id: string;
  setup: CanonicalHouseholdSetup;
}): CanonicalStructuredHouseholdState {
  const normalizedSetup = normalizeCanonicalSetup(args.setup);

  return {
    id: args.id,
    countryId: normalizedSetup.countryId,
    label: normalizedSetup.label,
    year: normalizedSetup.year,
    data: buildStructuredHouseholdDataFromCanonicalSetup(normalizedSetup),
  };
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
  value: CanonicalFieldValue,
  preferredYear: number | null
): HouseholdScalar {
  if (isYearValueMap(value)) {
    return selectYearValue(value, preferredYear);
  }
  return value;
}

export function wrapForYear(value: HouseholdScalar, year: number): Record<string, HouseholdScalar> {
  return { [String(year)]: value };
}

export function flattenEntityValues(
  values: CanonicalStructuredEntityValues,
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
): CanonicalStructuredEntityValues {
  const wrapped: CanonicalStructuredEntityValues = {};

  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) {
      continue;
    }

    const normalizedValue = normalizeCanonicalFieldValue(
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
