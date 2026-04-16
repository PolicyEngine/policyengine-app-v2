import type { CountryId } from '@/libs/countries';
import { cloneAppHouseholdInputData } from './appCodec';
import type { AppHouseholdInputData, HouseholdFieldValue } from './appTypes';
import {
  buildGeneratedGroupName,
  getV2GroupDefinitions,
  type HouseholdGroupDefinition,
} from './schema';
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
  V2SupportedCountryId,
  V2UKCreateHouseholdEnvelope,
  V2UKHouseholdPersonData,
  V2USCreateHouseholdEnvelope,
  V2USHouseholdPersonData,
} from './v2Types';

function normalizeV2CountryId(countryId: string): V2SupportedCountryId {
  const normalized = normalizeCountryId(countryId);

  if (normalized !== 'us' && normalized !== 'uk') {
    throw new Error(`V2 household country "${normalized}" is not supported`);
  }

  return normalized;
}

function coerceV2GroupRows(value: unknown): V2HouseholdGroupData[] {
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

function buildAppPeopleFromV2Envelope(args: {
  people: V2HouseholdEnvelope['people'];
  year: number;
  countryId: V2SupportedCountryId;
}): {
  people: AppHouseholdInputData['people'];
  personNameById: Map<number, string>;
} {
  const people: AppHouseholdInputData['people'] = {};
  const personNameById = new Map<number, string>();
  const usedNames = new Set<string>();
  const groupDefinitions = getV2GroupDefinitions(args.countryId);

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
        ...groupDefinitions.map((definition) => definition.personLinkKey),
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
  definition: HouseholdGroupDefinition;
  year: number;
}): AppHouseholdInputData[typeof args.definition.appKey] | undefined {
  const groupRows = coerceV2GroupRows(
    (args.envelope as unknown as Record<string, unknown>)[args.definition.v2Key]
  );
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

  const groupMap: NonNullable<AppHouseholdInputData[typeof args.definition.appKey]> = {};

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
      ) as Record<string, HouseholdFieldValue>),
    };
  });

  return groupMap;
}

export function parseV2HouseholdEnvelope(envelope: V2HouseholdEnvelope): {
  countryId: V2SupportedCountryId;
  label: string | null;
  year: number;
  householdData: AppHouseholdInputData;
} {
  const countryId = normalizeV2CountryId(envelope.country_id);
  const year = envelope.year;
  const { people, personNameById } = buildAppPeopleFromV2Envelope({
    people: envelope.people,
    year,
    countryId,
  });
  const peopleNames = Object.keys(people);

  const householdData: AppHouseholdInputData = { people };

  for (const definition of getV2GroupDefinitions(countryId)) {
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
  householdData: AppHouseholdInputData;
  year: number;
  countryId: V2SupportedCountryId;
}): V2HouseholdPersonData[] {
  const personNames = Object.keys(args.householdData.people).sort((left, right) =>
    left.localeCompare(right)
  );
  const personNameSet = new Set(personNames);
  const personAssignments = new Map<string, Record<string, number>>();

  for (const definition of getV2GroupDefinitions(args.countryId)) {
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
    AppHouseholdInputData[keyof Pick<
      AppHouseholdInputData,
      'households' | 'families' | 'taxUnits' | 'spmUnits' | 'maritalUnits' | 'benunits'
    >]
  >;
  definition: HouseholdGroupDefinition;
  year: number;
}): V2HouseholdGroupData[] {
  return Object.entries(args.groupMap)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, group], groupIndex) => {
      const groupValues = omitRecordKeys(group, ['members']) as Record<string, HouseholdFieldValue>;

      return {
        [args.definition.groupIdKey]: groupIndex,
        ...flattenEntityValues(groupValues, args.year),
      };
    });
}

function buildUSCreateEnvelope(args: {
  label: string | null;
  year: number;
  householdData: AppHouseholdInputData;
}): V2USCreateHouseholdEnvelope {
  const envelope: V2USCreateHouseholdEnvelope = {
    country_id: 'us',
    year: args.year,
    label: args.label,
    people: buildV2PeopleFromAppInput({
      householdData: args.householdData,
      year: args.year,
      countryId: 'us',
    }) as V2USHouseholdPersonData[],
    household: [],
    marital_unit: [],
    family: [],
    spm_unit: [],
    tax_unit: [],
  };

  for (const definition of getV2GroupDefinitions('us')) {
    const groupMap = args.householdData[definition.appKey];
    if (!groupMap) {
      continue;
    }

    const groupRows = buildV2GroupRowsFromAppInput({
      groupMap,
      definition,
      year: args.year,
    });

    switch (definition.v2Key) {
      case 'household':
        envelope.household = groupRows;
        break;
      case 'marital_unit':
        envelope.marital_unit = groupRows;
        break;
      case 'family':
        envelope.family = groupRows;
        break;
      case 'spm_unit':
        envelope.spm_unit = groupRows;
        break;
      case 'tax_unit':
        envelope.tax_unit = groupRows;
        break;
      default:
        throw new Error(`Unsupported US v2 household group key "${definition.v2Key}"`);
    }
  }

  return envelope;
}

function buildUKCreateEnvelope(args: {
  label: string | null;
  year: number;
  householdData: AppHouseholdInputData;
}): V2UKCreateHouseholdEnvelope {
  const envelope: V2UKCreateHouseholdEnvelope = {
    country_id: 'uk',
    year: args.year,
    label: args.label,
    people: buildV2PeopleFromAppInput({
      householdData: args.householdData,
      year: args.year,
      countryId: 'uk',
    }) as V2UKHouseholdPersonData[],
    household: [],
    benunit: [],
  };

  for (const definition of getV2GroupDefinitions('uk')) {
    const groupMap = args.householdData[definition.appKey];
    if (!groupMap) {
      continue;
    }

    const groupRows = buildV2GroupRowsFromAppInput({
      groupMap,
      definition,
      year: args.year,
    });

    switch (definition.v2Key) {
      case 'household':
        envelope.household = groupRows;
        break;
      case 'benunit':
        envelope.benunit = groupRows;
        break;
      default:
        throw new Error(`Unsupported UK v2 household group key "${definition.v2Key}"`);
    }
  }

  return envelope;
}

export function buildV2CreateEnvelope(args: {
  countryId: CountryId;
  label: string | null;
  year: number | null;
  householdData: AppHouseholdInputData;
}): V2CreateHouseholdEnvelope {
  const householdData = cloneAppHouseholdInputData(args.householdData);
  const year = args.year ?? inferYearFromData(householdData);

  if (year === null) {
    throw new Error('Household requires a year to convert to a v2 create envelope');
  }

  const countryId = normalizeV2CountryId(args.countryId);

  switch (countryId) {
    case 'us':
      return buildUSCreateEnvelope({
        label: args.label,
        year,
        householdData,
      });
    case 'uk':
      return buildUKCreateEnvelope({
        label: args.label,
        year,
        householdData,
      });
  }
}
