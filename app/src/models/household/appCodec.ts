import type {
  CanonicalHouseholdInputData,
  CanonicalHouseholdInputEnvelope,
  CanonicalHouseholdSetup,
} from './canonicalTypes';
import {
  buildNamedGroupCollection,
  parseNamedGroupCollection,
  parseNamedPeople,
} from './namedCodecHelpers';
import { buildGeneratedGroupName, GROUP_DEFINITIONS, KNOWN_APP_ENTITY_KEYS } from './schema';
import {
  getCanonicalGroupSetup,
  normalizeCanonicalSetup,
  normalizeCountryId,
  SETUP_KEY_BY_APP_KEY,
} from './utils';

export function parseAppHouseholdInput(
  input: CanonicalHouseholdInputEnvelope
): CanonicalHouseholdSetup {
  const rawData = input.householdData as unknown as Record<string, unknown>;
  const unknownKeys = Object.keys(rawData).filter((key) => !KNOWN_APP_ENTITY_KEYS.has(key));

  if (unknownKeys.length > 0) {
    throw new Error(`Unsupported household entities: ${unknownKeys.join(', ')}`);
  }

  const people = parseNamedPeople(rawData.people, 'Household input');
  const peopleNames = new Set(Object.keys(people));
  const setup: CanonicalHouseholdSetup = {
    countryId: normalizeCountryId(input.countryId),
    label: input.label ?? null,
    year: input.year ?? null,
    people,
  };

  for (const definition of GROUP_DEFINITIONS) {
    const parsedGroup = parseNamedGroupCollection({
      rawGroupCollection: rawData[definition.appKey],
      context: 'Household input',
      groupKey: definition.appKey,
      peopleNames,
    });

    if (parsedGroup) {
      setup[SETUP_KEY_BY_APP_KEY[definition.appKey]] = parsedGroup;
    }
  }

  return normalizeCanonicalSetup(setup);
}

export function buildAppHouseholdData(setup: CanonicalHouseholdSetup): CanonicalHouseholdInputData {
  const normalizedSetup = normalizeCanonicalSetup(setup);
  const householdData: CanonicalHouseholdInputData = {
    people: Object.fromEntries(
      Object.entries(normalizedSetup.people).map(([personName, person]) => [
        personName,
        person.values,
      ])
    ),
  };

  for (const definition of GROUP_DEFINITIONS) {
    const group = getCanonicalGroupSetup(normalizedSetup, definition.appKey);
    if (!group) {
      continue;
    }

    householdData[definition.appKey] = buildNamedGroupCollection({
      group,
      fallbackName: buildGeneratedGroupName(definition.generatedKeyPrefix, 0),
    });
  }

  return householdData;
}
