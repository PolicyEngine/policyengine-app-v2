import {
  getCanonicalGroupSetup,
  isYearValueMap,
  normalizeCanonicalSetup,
  normalizeCountryId,
  SETUP_KEY_BY_APP_KEY,
  wrapForYear,
} from './utils';
import { buildGeneratedGroupName, GROUP_DEFINITIONS, KNOWN_V1_ENTITY_KEYS } from './schema';
import type {
  CanonicalFieldValue,
  CanonicalGroupSetup,
  CanonicalHouseholdSetup,
  HouseholdScalar,
} from './canonicalTypes';
import type {
  V1HouseholdCreateEnvelope,
  V1HouseholdData,
  V1HouseholdGroupData,
  V1HouseholdMetadataEnvelope,
  V1HouseholdPersonData,
} from './v1Types';
import { buildNamedGroupCollection, parseNamedGroupCollection, parseNamedPeople } from './namedCodecHelpers';

function parseV1HouseholdData(args: {
  householdData: V1HouseholdData;
  countryId: string;
  label?: string | null;
}): CanonicalHouseholdSetup {
  const rawData = args.householdData as Record<string, unknown>;
  const unknownKeys = Object.keys(rawData).filter((key) => !KNOWN_V1_ENTITY_KEYS.has(key));

  if (unknownKeys.length > 0) {
    throw new Error(`Unsupported household entities in v1 payload: ${unknownKeys.join(', ')}`);
  }

  const people = parseNamedPeople(rawData.people, 'V1 household payload');
  const peopleNames = new Set(Object.keys(people));
  const setup: CanonicalHouseholdSetup = {
    countryId: normalizeCountryId(args.countryId),
    label: args.label ?? null,
    year: null,
    people,
  };

  for (const definition of GROUP_DEFINITIONS) {
    const parsedGroup = parseNamedGroupCollection({
      rawGroupCollection: rawData[definition.v1Key],
      context: 'V1 household payload',
      groupKey: definition.v1Key,
      peopleNames,
    });

    if (parsedGroup) {
      setup[SETUP_KEY_BY_APP_KEY[definition.appKey]] = parsedGroup;
    }
  }

  return normalizeCanonicalSetup(setup);
}

function buildV1FieldValue(
  value: CanonicalFieldValue,
  year: number | null,
  context: string
): Record<string, HouseholdScalar> {
  if (isYearValueMap(value)) {
    return value;
  }

  if (year === null) {
    throw new Error(`${context} requires a year to emit a v1 payload`);
  }

  return wrapForYear(value, year);
}

function buildV1PersonData(
  values: CanonicalGroupSetup['values'],
  year: number | null,
  context: string
): V1HouseholdPersonData {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, buildV1FieldValue(value, year, `${context}.${key}`)])
  );
}

function buildV1GroupData(args: {
  group: CanonicalGroupSetup;
  fallbackName: string;
  year: number | null;
}): Record<string, V1HouseholdGroupData> {
  const values = Object.fromEntries(
    Object.entries(args.group.values).map(([key, value]) => [
      key,
      buildV1FieldValue(value, args.year, `V1 household group "${args.fallbackName}".${key}`),
    ])
  );

  return buildNamedGroupCollection({
    group: {
      ...args.group,
      values,
    },
    fallbackName: args.fallbackName,
  }) as Record<string, V1HouseholdGroupData>;
}

function buildV1HouseholdData(setup: CanonicalHouseholdSetup): V1HouseholdData {
  const normalizedSetup = normalizeCanonicalSetup(setup);
  const year = normalizedSetup.year;
  const payloadData: Partial<V1HouseholdData> = {
    people: Object.fromEntries(
      Object.entries(normalizedSetup.people).map(([personName, person]) => [
        personName,
        buildV1PersonData(person.values, year, `V1 household person "${personName}"`),
      ])
    ),
  };

  for (const definition of GROUP_DEFINITIONS) {
    const group = getCanonicalGroupSetup(normalizedSetup, definition.appKey);
    if (!group) {
      continue;
    }

    payloadData[definition.v1Key] = buildV1GroupData({
      group,
      fallbackName: buildGeneratedGroupName(definition.generatedKeyPrefix, 0),
      year,
    });
  }

  return payloadData as V1HouseholdData;
}

export function parseV1MetadataEnvelope(
  metadata: V1HouseholdMetadataEnvelope
): CanonicalHouseholdSetup {
  return parseV1HouseholdData({
    householdData: metadata.household_json,
    countryId: metadata.country_id,
    label: metadata.label ?? null,
  });
}

export function parseV1CreateEnvelope(
  payload: V1HouseholdCreateEnvelope
): CanonicalHouseholdSetup {
  return parseV1HouseholdData({
    householdData: payload.data,
    countryId: payload.country_id,
    label: payload.label ?? null,
  });
}

export function buildV1CreateEnvelope(setup: CanonicalHouseholdSetup): V1HouseholdCreateEnvelope {
  const normalizedSetup = normalizeCanonicalSetup(setup);

  return {
    country_id: normalizedSetup.countryId,
    data: buildV1HouseholdData(normalizedSetup),
    label: normalizedSetup.label ?? undefined,
  };
}
