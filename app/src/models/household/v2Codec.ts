import { buildGeneratedGroupName, GROUP_DEFINITIONS, PERSON_META_KEYS } from './schema';
import type {
  CanonicalStructuredHouseholdData,
  CanonicalStructuredHouseholdState,
} from './canonicalTypes';
import type { HouseholdV2Source } from './types';
import type { V2CreateHouseholdEnvelope, V2HouseholdShape } from './v2Types';
import {
  flattenEntityValues,
  inferYearFromData,
  isRecord,
  omitRecordKeys,
  wrapEntityValuesForYear,
} from './utils';

function buildPeopleFromV2Response(
  people: HouseholdV2Source['people'],
  year: number
): {
  peopleByName: CanonicalStructuredHouseholdData['people'];
  personNameById: Map<number, string>;
} {
  const peopleByName: CanonicalStructuredHouseholdData['people'] = {};
  const personNameById = new Map<number, string>();
  const usedNames = new Set<string>();

  for (const [index, rawPerson] of people.entries()) {
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
    peopleByName[personName] = wrapEntityValuesForYear(
      omitRecordKeys(person, PERSON_META_KEYS),
      year
    );
  }

  return { peopleByName, personNameById };
}

function buildGroupMembersFromPeople(args: {
  people: HouseholdV2Source['people'];
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

export function parseV2HouseholdShape(
  shape: HouseholdV2Source
): CanonicalStructuredHouseholdData {
  const { peopleByName, personNameById } = buildPeopleFromV2Response(shape.people, shape.year);
  const groups: CanonicalStructuredHouseholdData['groups'] = {};

  for (const definition of GROUP_DEFINITIONS) {
    const rawGroup = shape[definition.v2Key];
    if (rawGroup == null) {
      continue;
    }

    if (!isRecord(rawGroup)) {
      throw new Error(`V2 household ${definition.v2Key} must be an object when present`);
    }

    const groupId = rawGroup[definition.groupIdKey];
    if (typeof groupId !== 'number') {
      throw new Error(
        `V2 household ${definition.v2Key} is missing numeric ${definition.groupIdKey}`
      );
    }

    const members = buildGroupMembersFromPeople({
      people: shape.people,
      personNameById,
      personLinkKey: definition.personLinkKey,
      groupId,
      groupLabel: definition.v2Key,
    });

    if (members.length === 0) {
      throw new Error(
        `V2 household ${definition.v2Key} has no linked members for ${definition.groupIdKey}=${groupId}`
      );
    }

    groups[definition.appKey] = {
      name: buildGeneratedGroupName(definition.generatedKeyPrefix, 0),
      members,
      values: wrapEntityValuesForYear(
        omitRecordKeys(rawGroup, [definition.groupIdKey]),
        shape.year
      ),
    };
  }

  return {
    people: peopleByName,
    groups,
  };
}

export function buildV2HouseholdShape(
  state: CanonicalStructuredHouseholdState
): V2HouseholdShape {
  const year = state.year ?? inferYearFromData(state.data);
  if (year === null) {
    throw new Error('Household requires a year to convert to v2 shape');
  }

  const personNames = Object.keys(state.data.people).sort((left, right) =>
    left.localeCompare(right)
  );
  const personNameSet = new Set(personNames);
  const personAssignments = new Map<string, Record<string, number>>();

  for (const definition of GROUP_DEFINITIONS) {
    const group = state.data.groups[definition.appKey];
    if (!group) {
      continue;
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

  const people = personNames.map((personName, personIndex) => ({
    name: personName,
    person_id: personIndex,
    ...personAssignments.get(personName),
    ...flattenEntityValues(state.data.people[personName], year),
  }));

  const shape: V2HouseholdShape = {
    id: state.id === 'draft-household' ? undefined : state.id,
    country_id: state.countryId,
    year,
    label: state.label,
    people,
  };

  for (const definition of GROUP_DEFINITIONS) {
    const group = state.data.groups[definition.appKey];
    if (!group) {
      continue;
    }

    shape[definition.v2Key] = {
      [definition.groupIdKey]: 0,
      ...flattenEntityValues(group.values, year),
    };
  }

  return shape;
}

export function buildV2CreateRequest(
  state: CanonicalStructuredHouseholdState
): V2CreateHouseholdEnvelope {
  const { id: _ignoredId, ...request } = buildV2HouseholdShape(state);
  return request;
}
