import type {
  CanonicalFieldMap,
  CanonicalGroupSetup,
  CanonicalHouseholdInputGroup,
  CanonicalPersonSetup,
} from './canonicalTypes';
import { cloneValue, isRecord, normalizeCanonicalFieldMap } from './utils';

export function parseNamedPeople(
  rawPeople: unknown,
  context: string
): Record<string, CanonicalPersonSetup> {
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

      return [
        personName,
        {
          values: normalizeCanonicalFieldMap(rawPerson, `${context}: person "${personName}"`),
        },
      ];
    })
  );
}

export function parseNamedGroupCollection(args: {
  rawGroupCollection: unknown;
  context: string;
  groupKey: string;
  peopleNames: Set<string>;
}): CanonicalGroupSetup | undefined {
  if (args.rawGroupCollection === undefined) {
    return undefined;
  }

  if (!isRecord(args.rawGroupCollection)) {
    throw new Error(`${args.context}: ${args.groupKey} must be an object`);
  }

  const entries = Object.entries(args.rawGroupCollection);
  if (entries.length === 0) {
    return undefined;
  }
  if (entries.length > 1) {
    throw new Error(
      `${args.context}: expected at most one ${args.groupKey} entry, received ${entries.length}`
    );
  }

  const [groupName, rawGroup] = entries[0];
  if (!isRecord(rawGroup)) {
    throw new Error(`${args.context}: ${args.groupKey}.${groupName} must be an object`);
  }

  if (!Array.isArray(rawGroup.members)) {
    throw new Error(`${args.context}: ${args.groupKey}.${groupName}.members must be an array`);
  }

  const members = rawGroup.members.map((member) => String(member));
  const unknownMembers = members.filter((member) => !args.peopleNames.has(member));
  if (unknownMembers.length > 0) {
    throw new Error(
      `${args.context}: ${args.groupKey}.${groupName} references unknown members: ${unknownMembers.join(', ')}`
    );
  }

  const { members: _ignoredMembers, ...rawValues } = rawGroup;

  return {
    name: groupName,
    members,
    values: normalizeCanonicalFieldMap(
      rawValues,
      `${args.context}: ${args.groupKey}.${groupName}`
    ),
  };
}

export function buildNamedGroupCollection(args: {
  group: CanonicalGroupSetup;
  fallbackName: string;
}): Record<string, CanonicalHouseholdInputGroup> {
  const groupName =
    typeof args.group.name === 'string' && args.group.name.length > 0
      ? args.group.name
      : args.fallbackName;

  return {
    [groupName]: {
      members: cloneValue(args.group.members),
      ...(cloneValue(args.group.values) as CanonicalFieldMap),
    },
  };
}
