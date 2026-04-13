import { GROUP_DEFINITIONS, PERSON_META_KEYS } from './schema';
import type {
  CanonicalGroupSetup,
  CanonicalHouseholdSetup,
  CanonicalPersonSetup,
} from './canonicalTypes';
import type {
  V2CreateHouseholdEnvelope,
  V2HouseholdEnvelope,
  V2HouseholdPersonData,
} from './v2Types';
import {
  flattenEntityValues,
  getCanonicalGroupSetup,
  inferYearFromData,
  isRecord,
  normalizeCanonicalSetup,
  normalizeCountryId,
  omitRecordKeys,
  SETUP_KEY_BY_APP_KEY,
  wrapEntityValuesForYear,
} from './utils';

function buildCanonicalPeopleFromV2Envelope(args: {
  people: V2HouseholdEnvelope['people'];
  year: number;
}): {
  people: Record<string, CanonicalPersonSetup>;
  personNameById: Map<number, string>;
} {
  const people: Record<string, CanonicalPersonSetup> = {};
  const personNameById = new Map<number, string>();
  const usedNames = new Set<string>();

  for (const [index, rawPerson] of args.people.entries()) {
    const person = isRecord(rawPerson) ? rawPerson : {};
    const personId = typeof person.person_id === 'number' ? person.person_id : index;
    const explicitName =
      typeof person.name === 'string' && person.name.length > 0 ? person.name : null;

    if (explicitName && usedNames.has(explicitName)) {
      throw new Error(`Duplicate person name "${explicitName}" in v2 household response`);
    }

    let personName = explicitName ?? `person_${personId}`;
    while (usedNames.has(personName)) {
      personName = `${personName}_${index + 1}`;
    }

    usedNames.add(personName);
    personNameById.set(personId, personName);
    people[personName] = {
      values: wrapEntityValuesForYear(omitRecordKeys(person, PERSON_META_KEYS), args.year),
    };
  }

  return { people, personNameById };
}

function buildGroupMembersFromV2People(args: {
  people: V2HouseholdEnvelope['people'];
  personNameById: Map<number, string>;
  personLinkKey: string;
  groupId: number;
  groupLabel: string;
}): string[] {
  const members: string[] = [];

  for (const [index, rawPerson] of args.people.entries()) {
    const person = isRecord(rawPerson) ? rawPerson : {};
    const linkedGroupId =
      typeof person[args.personLinkKey] === 'number'
        ? (person[args.personLinkKey] as number)
        : null;
    const personId = typeof person.person_id === 'number' ? (person.person_id as number) : index;

    if (linkedGroupId !== args.groupId) {
      continue;
    }

    const personName = args.personNameById.get(personId);
    if (!personName) {
      throw new Error(`${args.groupLabel}: linked person ${personId} could not be resolved`);
    }

    members.push(personName);
  }

  return members;
}

function parseV2Group(args: {
  envelope: V2HouseholdEnvelope;
  definition: (typeof GROUP_DEFINITIONS)[number];
  personNameById: Map<number, string>;
}): CanonicalGroupSetup | undefined {
  const rawGroup = args.envelope[args.definition.v2Key];
  if (rawGroup == null) {
    return undefined;
  }

  if (!isRecord(rawGroup)) {
    throw new Error(`V2 household ${args.definition.v2Key} must be an object when present`);
  }

  const groupId = rawGroup[args.definition.groupIdKey];
  if (typeof groupId !== 'number') {
    throw new Error(
      `V2 household ${args.definition.v2Key} is missing numeric ${args.definition.groupIdKey}`
    );
  }

  const members = buildGroupMembersFromV2People({
    people: args.envelope.people,
    personNameById: args.personNameById,
    personLinkKey: args.definition.personLinkKey,
    groupId,
    groupLabel: args.definition.v2Key,
  });

  if (members.length === 0) {
    throw new Error(
      `V2 household ${args.definition.v2Key} has no linked members for ${args.definition.groupIdKey}=${groupId}`
    );
  }

  return {
    members,
    values: wrapEntityValuesForYear(
      omitRecordKeys(rawGroup, [args.definition.groupIdKey]),
      args.envelope.year
    ),
  };
}

export function parseV2HouseholdEnvelope(
  envelope: V2HouseholdEnvelope
): CanonicalHouseholdSetup {
  const { people, personNameById } = buildCanonicalPeopleFromV2Envelope({
    people: envelope.people,
    year: envelope.year,
  });

  const setup: CanonicalHouseholdSetup = {
    countryId: normalizeCountryId(envelope.country_id),
    label: envelope.label ?? null,
    year: envelope.year,
    people,
  };

  for (const definition of GROUP_DEFINITIONS) {
    const parsedGroup = parseV2Group({
      envelope,
      definition,
      personNameById,
    });

    if (parsedGroup) {
      setup[SETUP_KEY_BY_APP_KEY[definition.appKey]] = parsedGroup;
    }
  }

  return normalizeCanonicalSetup(setup);
}

function buildV2People(setup: CanonicalHouseholdSetup, year: number): V2HouseholdPersonData[] {
  const personNames = Object.keys(setup.people).sort((left, right) => left.localeCompare(right));
  const personNameSet = new Set(personNames);
  const personAssignments = new Map<string, Record<string, number>>();

  for (const definition of GROUP_DEFINITIONS) {
    const group = getCanonicalGroupSetup(setup, definition.appKey);
    if (!group) {
      continue;
    }

    if (group.members.length === 0) {
      throw new Error(`Household ${definition.appKey} must have at least one member`);
    }

    const unknownMembers = group.members.filter((member) => !personNameSet.has(member));
    if (unknownMembers.length > 0) {
      throw new Error(
        `Household ${definition.appKey} references unknown members: ${unknownMembers.join(', ')}`
      );
    }

    group.members.forEach((member) => {
      const currentAssignments = personAssignments.get(member) ?? {};
      currentAssignments[definition.personLinkKey] = 0;
      personAssignments.set(member, currentAssignments);
    });
  }

  return personNames.map((personName, personIndex) => ({
    name: personName,
    person_id: personIndex,
    ...personAssignments.get(personName),
    ...flattenEntityValues(setup.people[personName].values, year),
  }));
}

export function buildV2CreateEnvelope(setup: CanonicalHouseholdSetup): V2CreateHouseholdEnvelope {
  const normalizedSetup = normalizeCanonicalSetup(setup);
  const year = normalizedSetup.year ?? inferYearFromData(normalizedSetup);

  if (year === null) {
    throw new Error('Household requires a year to convert to a v2 create envelope');
  }

  const envelope: V2CreateHouseholdEnvelope = {
    country_id: normalizedSetup.countryId,
    year,
    label: normalizedSetup.label,
    people: buildV2People(normalizedSetup, year),
  };

  for (const definition of GROUP_DEFINITIONS) {
    const group = getCanonicalGroupSetup(normalizedSetup, definition.appKey);
    if (!group) {
      continue;
    }

    envelope[definition.v2Key] = {
      [definition.groupIdKey]: 0,
      ...flattenEntityValues(group.values, year),
    };
  }

  return envelope;
}
