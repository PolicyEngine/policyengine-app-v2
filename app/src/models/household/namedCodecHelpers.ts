import type { HouseholdFieldValue } from './appTypes';
import { isRecord, normalizeHouseholdFieldMap } from './utils';

export function parseNamedPeople(
  rawPeople: unknown,
  context: string
): Record<string, { values: Record<string, HouseholdFieldValue> }> {
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
          values: normalizeHouseholdFieldMap(rawPerson, `${context}: person "${personName}"`),
        },
      ];
    })
  );
}

export function validateNamedGroupCollection(args: {
  rawGroupCollection: unknown;
  context: string;
  groupKey: string;
  peopleNames: Set<string>;
}): void {
  if (args.rawGroupCollection === undefined) {
    return;
  }

  if (!isRecord(args.rawGroupCollection)) {
    throw new Error(`${args.context}: ${args.groupKey} must be an object`);
  }

  for (const [groupName, rawGroup] of Object.entries(args.rawGroupCollection)) {
    parseNamedGroup({
      groupName,
      rawGroup,
      context: args.context,
      groupKey: args.groupKey,
      peopleNames: args.peopleNames,
    });
  }
}

function parseNamedGroup(args: {
  groupName: string;
  rawGroup: unknown;
  context: string;
  groupKey: string;
  peopleNames: Set<string>;
}): { name?: string; members: string[]; values: Record<string, HouseholdFieldValue> } {
  const { groupName, rawGroup } = args;
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
    values: normalizeHouseholdFieldMap(rawValues, `${args.context}: ${args.groupKey}.${groupName}`),
  };
}
