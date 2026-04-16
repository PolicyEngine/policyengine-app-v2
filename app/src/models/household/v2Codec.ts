import type { CountryId } from '@/libs/countries';
import { cloneAppHouseholdInputData } from './appCodec';
import type { CanonicalFieldValue, CanonicalHouseholdInputData } from './canonicalTypes';
import { buildGeneratedGroupName, GROUP_DEFINITIONS } from './schema';
import {
  flattenEntityValues,
  inferYearFromData,
  isRecord,
  normalizeCountryId,
  omitRecordKeys,
  wrapEntityValuesForYear,
} from './utils';
import type {
  V2CreateHouseholdEnvelope,
  V2HouseholdEnvelope,
  V2HouseholdGroupData,
  V2HouseholdPersonData,
} from './v2Types';

function coerceV2GroupRows(
  value: V2HouseholdEnvelope[keyof Pick<
    V2HouseholdEnvelope,
    'tax_unit' | 'family' | 'spm_unit' | 'marital_unit' | 'household' | 'benunit'
  >]
): V2HouseholdGroupData[] {
  if (value == null) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (isRecord(value)) {
    return [value];
  }

  throw new Error('V2 household group rows must be arrays when present');
}

function buildCanonicalPeopleFromV2Envelope(args: {
  people: V2HouseholdEnvelope['people'];
  year: number;
}): {
  people: CanonicalHouseholdInputData['people'];
  personNameById: Map<number, string>;
} {
  const people: CanonicalHouseholdInputData['people'] = {};
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
    people[personName] = wrapEntityValuesForYear(
      omitRecordKeys(person, [
        'name',
        'person_id',
        ...GROUP_DEFINITIONS.map((d) => d.personLinkKey),
      ]),
      args.year
    );
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

function hasExplicitPersonLinkAssignments(args: {
  people: V2HouseholdEnvelope['people'];
  personLinkKey: string;
}): boolean {
  return args.people.some((rawPerson) => {
    const person = isRecord(rawPerson) ? rawPerson : {};
    return typeof person[args.personLinkKey] === 'number';
  });
}

function parseV2GroupCollection(args: {
  envelope: V2HouseholdEnvelope;
  peopleNames: string[];
  personNameById: Map<number, string>;
  definition: (typeof GROUP_DEFINITIONS)[number];
  year: number;
}): CanonicalHouseholdInputData[typeof args.definition.appKey] | undefined {
  const groupRows = coerceV2GroupRows(args.envelope[args.definition.v2Key]);
  if (groupRows.length === 0) {
    return undefined;
  }

  const hasExplicitLinks = hasExplicitPersonLinkAssignments({
    people: args.envelope.people,
    personLinkKey: args.definition.personLinkKey,
  });

  if (groupRows.length > 1 && !hasExplicitLinks) {
    throw new Error(
      `V2 household ${args.definition.v2Key} has multiple rows but people do not include ${args.definition.personLinkKey}`
    );
  }

  const groupMap: NonNullable<CanonicalHouseholdInputData[typeof args.definition.appKey]> = {};

  groupRows.forEach((rawGroup, index) => {
    if (!isRecord(rawGroup)) {
      throw new Error(`V2 household ${args.definition.v2Key} rows must be objects`);
    }

    const groupId = rawGroup[args.definition.groupIdKey];
    let members: string[];

    if (typeof groupId === 'number') {
      members = buildGroupMembersFromV2People({
        people: args.envelope.people,
        personNameById: args.personNameById,
        personLinkKey: args.definition.personLinkKey,
        groupId,
        groupLabel: args.definition.v2Key,
      });

      if (members.length === 0) {
        if (!hasExplicitLinks && groupRows.length === 1) {
          members = [...args.peopleNames];
        } else {
          throw new Error(
            `V2 household ${args.definition.v2Key} has no linked members for ${args.definition.groupIdKey}=${groupId}`
          );
        }
      }
    } else if (hasExplicitLinks) {
      throw new Error(
        `V2 household ${args.definition.v2Key} is missing numeric ${args.definition.groupIdKey}`
      );
    } else {
      members = [...args.peopleNames];
    }

    groupMap[buildGeneratedGroupName(args.definition.generatedKeyPrefix, index)] = {
      members,
      ...(wrapEntityValuesForYear(
        omitRecordKeys(rawGroup, [args.definition.groupIdKey]),
        args.year
      ) as Record<string, CanonicalFieldValue>),
    };
  });

  return groupMap;
}

export function parseV2HouseholdEnvelope(envelope: V2HouseholdEnvelope): {
  countryId: CountryId;
  label: string | null;
  year: number;
  householdData: CanonicalHouseholdInputData;
} {
  const countryId = normalizeCountryId(envelope.country_id);
  const year = envelope.year;
  const { people, personNameById } = buildCanonicalPeopleFromV2Envelope({
    people: envelope.people,
    year,
  });
  const peopleNames = Object.keys(people);

  const householdData: CanonicalHouseholdInputData = { people };

  for (const definition of GROUP_DEFINITIONS) {
    const parsedGroupCollection = parseV2GroupCollection({
      envelope,
      peopleNames,
      personNameById,
      definition,
      year,
    });

    if (parsedGroupCollection) {
      householdData[definition.appKey] = parsedGroupCollection;
    }
  }

  return {
    countryId,
    label: envelope.label ?? null,
    year,
    householdData,
  };
}

function buildV2PeopleFromAppInput(args: {
  householdData: CanonicalHouseholdInputData;
  year: number;
}): V2HouseholdPersonData[] {
  const personNames = Object.keys(args.householdData.people).sort((left, right) =>
    left.localeCompare(right)
  );
  const personNameSet = new Set(personNames);
  const personAssignments = new Map<string, Record<string, number>>();

  for (const definition of GROUP_DEFINITIONS) {
    const groupMap = args.householdData[definition.appKey];
    if (!groupMap) {
      continue;
    }

    const sortedGroups = Object.entries(groupMap).sort(([left], [right]) =>
      left.localeCompare(right)
    );

    sortedGroups.forEach(([groupName, group], groupIndex) => {
      if (group.members.length === 0) {
        throw new Error(
          `Household ${definition.appKey}.${groupName} must have at least one member`
        );
      }

      const unknownMembers = group.members.filter((member) => !personNameSet.has(member));
      if (unknownMembers.length > 0) {
        throw new Error(
          `Household ${definition.appKey}.${groupName} references unknown members: ${unknownMembers.join(', ')}`
        );
      }

      group.members.forEach((member) => {
        const currentAssignments = personAssignments.get(member) ?? {};
        currentAssignments[definition.personLinkKey] = groupIndex;
        personAssignments.set(member, currentAssignments);
      });
    });
  }

  return personNames.map((personName, personIndex) => ({
    name: personName,
    person_id: personIndex,
    ...personAssignments.get(personName),
    ...flattenEntityValues(args.householdData.people[personName], args.year),
  }));
}

function buildV2GroupRowsFromAppInput(args: {
  groupMap: NonNullable<
    CanonicalHouseholdInputData[keyof Pick<
      CanonicalHouseholdInputData,
      'households' | 'families' | 'taxUnits' | 'spmUnits' | 'maritalUnits' | 'benunits'
    >]
  >;
  definition: (typeof GROUP_DEFINITIONS)[number];
  year: number;
}): V2HouseholdGroupData[] {
  return Object.entries(args.groupMap)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, group], groupIndex) => {
      const groupValues = omitRecordKeys(group, ['members']) as Record<string, CanonicalFieldValue>;

      return {
        [args.definition.groupIdKey]: groupIndex,
        ...flattenEntityValues(groupValues, args.year),
      };
    });
}

export function buildV2CreateEnvelope(args: {
  countryId: CountryId;
  label: string | null;
  year: number | null;
  householdData: CanonicalHouseholdInputData;
}): V2CreateHouseholdEnvelope {
  const householdData = cloneAppHouseholdInputData(args.householdData);
  const year = args.year ?? inferYearFromData(householdData);

  if (year === null) {
    throw new Error('Household requires a year to convert to a v2 create envelope');
  }

  const envelope: V2CreateHouseholdEnvelope = {
    country_id: normalizeCountryId(args.countryId),
    year,
    label: args.label,
    people: buildV2PeopleFromAppInput({
      householdData,
      year,
    }),
    tax_unit: [],
    family: [],
    spm_unit: [],
    marital_unit: [],
    household: [],
    benunit: [],
  };

  for (const definition of GROUP_DEFINITIONS) {
    const groupMap = householdData[definition.appKey];
    if (!groupMap) {
      continue;
    }

    envelope[definition.v2Key] = buildV2GroupRowsFromAppInput({
      groupMap,
      definition,
      year,
    });
  }

  return envelope;
}
