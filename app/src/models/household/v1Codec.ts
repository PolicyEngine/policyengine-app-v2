import type { HouseholdData as IngredientHouseholdData } from '@/types/ingredients/Household';
import type { HouseholdCreationPayload } from '@/types/payloads';
import {
  getGroupDefinitionByAppKey,
  GROUP_DEFINITIONS,
  KNOWN_APP_ENTITY_KEYS,
  KNOWN_V1_ENTITY_KEYS,
} from './schema';
import type { CanonicalGroup, CanonicalHouseholdData, HouseholdV1PayloadData } from './types';
import { cloneValue, isRecord } from './utils';

function parsePeople(rawPeople: unknown, context: string): CanonicalHouseholdData['people'] {
  if (rawPeople === undefined) {
    return {};
  }

  if (!isRecord(rawPeople)) {
    throw new Error(`${context}: people must be an object`);
  }

  return Object.fromEntries(
    Object.entries(rawPeople).map(([personName, rawPerson]) => {
      if (!isRecord(rawPerson)) {
        throw new Error(`${context}: person "${personName}" must be an object`);
      }

      return [personName, cloneValue(rawPerson)];
    })
  );
}

function parseGroup(
  rawGroupCollection: unknown,
  context: string,
  groupKey: string,
  peopleNames: Set<string>
): CanonicalGroup | undefined {
  if (rawGroupCollection === undefined) {
    return undefined;
  }

  if (!isRecord(rawGroupCollection)) {
    throw new Error(`${context}: ${groupKey} must be an object`);
  }

  const entries = Object.entries(rawGroupCollection);
  if (entries.length === 0) {
    return undefined;
  }
  if (entries.length > 1) {
    throw new Error(
      `${context}: expected at most one ${groupKey} entry, received ${entries.length}`
    );
  }

  const [groupName, rawGroup] = entries[0];
  if (!isRecord(rawGroup)) {
    throw new Error(`${context}: ${groupKey}.${groupName} must be an object`);
  }

  if (!Array.isArray(rawGroup.members)) {
    throw new Error(`${context}: ${groupKey}.${groupName}.members must be an array`);
  }

  const members = rawGroup.members.map((member) => String(member));
  const unknownMembers = members.filter((member) => !peopleNames.has(member));
  if (unknownMembers.length > 0) {
    throw new Error(
      `${context}: ${groupKey}.${groupName} references unknown members: ${unknownMembers.join(', ')}`
    );
  }

  const { members: _ignoredMembers, ...rawValues } = rawGroup;

  return {
    name: groupName,
    members,
    values: cloneValue(rawValues),
  };
}

export function parseAppHouseholdData(
  householdData: IngredientHouseholdData
): CanonicalHouseholdData {
  const rawData = householdData as Record<string, unknown>;
  const unknownKeys = Object.keys(rawData).filter((key) => !KNOWN_APP_ENTITY_KEYS.has(key));

  if (unknownKeys.length > 0) {
    throw new Error(`Unsupported household entities: ${unknownKeys.join(', ')}`);
  }

  const people = parsePeople(rawData.people, 'Household input');
  const peopleNames = new Set(Object.keys(people));
  const groups: CanonicalHouseholdData['groups'] = {};

  for (const definition of GROUP_DEFINITIONS) {
    const parsedGroup = parseGroup(
      rawData[definition.appKey],
      'Household input',
      definition.appKey,
      peopleNames
    );

    if (parsedGroup) {
      groups[definition.appKey] = parsedGroup;
    }
  }

  return { people, groups };
}

export function parseV1HouseholdData(
  householdData: HouseholdV1PayloadData
): CanonicalHouseholdData {
  const rawData = householdData as Record<string, unknown>;
  const unknownKeys = Object.keys(rawData).filter((key) => !KNOWN_V1_ENTITY_KEYS.has(key));

  if (unknownKeys.length > 0) {
    throw new Error(`Unsupported household entities in v1 payload: ${unknownKeys.join(', ')}`);
  }

  const people = parsePeople(rawData.people, 'V1 household payload');
  const peopleNames = new Set(Object.keys(people));
  const groups: CanonicalHouseholdData['groups'] = {};

  for (const definition of GROUP_DEFINITIONS) {
    const parsedGroup = parseGroup(
      rawData[definition.v1Key],
      'V1 household payload',
      definition.v1Key,
      peopleNames
    );

    if (parsedGroup) {
      groups[definition.appKey] = parsedGroup;
    }
  }

  return { people, groups };
}

function buildGroupCollection(group: CanonicalGroup): Record<string, Record<string, unknown>> {
  return {
    [group.name]: {
      members: cloneValue(group.members),
      ...cloneValue(group.values),
    },
  };
}

export function buildAppHouseholdData(data: CanonicalHouseholdData): IngredientHouseholdData {
  const householdData: Record<string, unknown> = {
    people: cloneValue(data.people),
  };

  for (const [groupKey, group] of Object.entries(data.groups)) {
    if (!group) {
      continue;
    }

    const definition = getGroupDefinitionByAppKey(groupKey);
    if (!definition) {
      throw new Error(`Unsupported canonical household group "${groupKey}"`);
    }

    householdData[definition.appKey] = buildGroupCollection(group);
  }

  return householdData as IngredientHouseholdData;
}

export function buildV1PayloadData(data: CanonicalHouseholdData): HouseholdCreationPayload['data'] {
  const payloadData: Record<string, unknown> = {
    people: cloneValue(data.people),
  };

  for (const [groupKey, group] of Object.entries(data.groups)) {
    if (!group) {
      continue;
    }

    const definition = getGroupDefinitionByAppKey(groupKey);
    if (!definition) {
      throw new Error(`Unsupported canonical household group "${groupKey}"`);
    }

    payloadData[definition.v1Key] = buildGroupCollection(group);
  }

  return payloadData as HouseholdCreationPayload['data'];
}
