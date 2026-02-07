/**
 * householdIndividuals - Person and entity extraction utilities for API v2 Alpha structure
 *
 * People are identified by array index + is_tax_unit_dependent (US) or age (UK).
 * Entity groups are single flat dicts (not arrays).
 */

import { EntityType, Household, HouseholdPerson } from '@/types/ingredients/Household';
import * as HouseholdQueries from './HouseholdQueries';

/**
 * Return people in their existing array order (already sorted by convention:
 * adults first, dependents after)
 */
export function sortPeopleByOrder(people: HouseholdPerson[]): HouseholdPerson[] {
  return [...people];
}

export interface EntityVariable {
  paramName: string;
  label: string;
  value: any;
  unit?: string;
}

export interface EntityMember {
  id: number; // array index
  name: string;
  variables: EntityVariable[];
}

export interface GroupEntity {
  entityType: EntityType;
  entityTypeName: string;
  instances: GroupEntityInstance[];
}

export interface GroupEntityInstance {
  id: number;
  name: string;
  members: EntityMember[];
  variables?: EntityVariable[];
}

/**
 * Extract all group entities from household data.
 * Entity groups are single dicts, so each type has at most one instance.
 */
export function extractGroupEntities(
  household: Household,
  variablesMetadata?: Record<string, any>
): GroupEntity[] {
  const groupEntities: GroupEntity[] = [];

  // Extract people as a group entity
  if (household.people.length > 0) {
    const peopleInstances: GroupEntityInstance[] = household.people.map((person, index) => ({
      id: index,
      name: getPersonDisplayName(person, index),
      members: [extractEntityMember(person, index, variablesMetadata)],
    }));

    groupEntities.push({
      entityType: 'person',
      entityTypeName: 'People',
      instances: peopleInstances,
    });
  }

  // Extract entity types based on household model
  const entityTypesToExtract: EntityType[] = HouseholdQueries.isUSHousehold(household)
    ? ['tax_unit', 'family', 'spm_unit', 'marital_unit', 'household']
    : ['benunit', 'household'];

  for (const entityType of entityTypesToExtract) {
    const entity = household[entityType as keyof Household] as Record<string, any> | undefined;
    if (!entity || typeof entity !== 'object' || Array.isArray(entity)) {
      continue;
    }

    // Extract entity-level variables
    const entityVariables = extractEntityVariables(entity, variablesMetadata);

    // Skip if no variables
    if (entityVariables.length === 0) {
      continue;
    }

    // All people are members of every entity
    const members = household.people.map((person, index) =>
      extractEntityMember(person, index, variablesMetadata)
    );

    const instances: GroupEntityInstance[] = [
      {
        id: 0,
        name: formatEntityTypeName(entityType),
        members,
        variables: entityVariables,
      },
    ];

    groupEntities.push({
      entityType,
      entityTypeName: formatEntityTypeName(entityType),
      instances,
    });
  }

  return groupEntities;
}

/**
 * Extract variables from an entity dict (not including system fields)
 */
function extractEntityVariables(
  entity: Record<string, any>,
  variablesMetadata?: Record<string, any>
): EntityVariable[] {
  const variables: EntityVariable[] = [];

  for (const [paramName, value] of Object.entries(entity)) {
    // Skip undefined values
    if (value === undefined) {
      continue;
    }

    const unit = variablesMetadata?.[paramName]?.unit;

    variables.push({
      paramName,
      label: formatParameterLabel(paramName),
      value,
      unit,
    });
  }

  return variables;
}

/**
 * Extract a single entity member with their variables
 */
function extractEntityMember(
  person: HouseholdPerson,
  index: number,
  variablesMetadata?: Record<string, any>
): EntityMember {
  const variables: EntityVariable[] = [];

  for (const [paramName, value] of Object.entries(person)) {
    if (value === undefined) {
      continue;
    }

    const unit = variablesMetadata?.[paramName]?.unit;

    variables.push({
      paramName,
      label: formatParameterLabel(paramName),
      value,
      unit,
    });
  }

  return {
    id: index,
    name: getPersonDisplayName(person, index),
    variables,
  };
}

/**
 * Format parameter name to human-readable label
 * Capitalizes only the first letter of the first word (sentence case)
 */
function formatParameterLabel(paramName: string): string {
  const words = paramName.split('_');
  return words
    .map((word, index) => {
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      return word.toLowerCase();
    })
    .join(' ');
}

/**
 * Format person display name from array index and role.
 *
 * Convention:
 * - Index 0: "You"
 * - Non-dependent at index 1+: "Your partner"
 * - Dependents: "Your first dependent", "Your second dependent", etc.
 *
 * For US: dependents identified by is_tax_unit_dependent === true
 * For UK: dependents identified by age < 18
 */
export function getPersonDisplayName(person: HouseholdPerson, index: number): string {
  if (index === 0) {
    return 'you';
  }

  // Check if this person is a dependent
  const isDependent =
    person.is_tax_unit_dependent === true || (person.age !== undefined && person.age < 18);

  if (!isDependent) {
    return 'your partner';
  }

  // Count how many dependents come before this person in the array
  // We don't have access to the full people array here, so we derive from index
  // The caller should use getDependentOrdinalName for precise ordinal
  const ordinals = [
    'first',
    'second',
    'third',
    'fourth',
    'fifth',
    'sixth',
    'seventh',
    'eighth',
    'ninth',
    'tenth',
  ];
  // Default to using index - 1 or index - 2 depending on partner presence
  // This is a best-effort: the precise ordinal needs full array context
  const ordinal = ordinals[0] || '1st';
  return `your ${ordinal} dependent`;
}

/**
 * Get person display name with full array context for precise dependent ordinals
 */
export function getPersonDisplayNameInContext(people: HouseholdPerson[], index: number): string {
  if (index === 0) {
    return 'you';
  }

  const person = people[index];
  if (!person) {
    return `person ${index + 1}`;
  }

  const isDependent =
    person.is_tax_unit_dependent === true || (person.age !== undefined && person.age < 18);

  if (!isDependent) {
    return 'your partner';
  }

  // Count dependents before this person
  let dependentOrdinal = 0;
  for (let i = 0; i < index; i++) {
    const p = people[i];
    if (p.is_tax_unit_dependent === true || (p.age !== undefined && p.age < 18)) {
      dependentOrdinal++;
    }
  }

  const ordinals = [
    'first',
    'second',
    'third',
    'fourth',
    'fifth',
    'sixth',
    'seventh',
    'eighth',
    'ninth',
    'tenth',
  ];
  const ordinal = ordinals[dependentOrdinal] || `${dependentOrdinal + 1}th`;
  return `your ${ordinal} dependent`;
}

/**
 * Format entity type to human-readable name
 */
function formatEntityTypeName(entityType: EntityType): string {
  switch (entityType) {
    case 'person':
      return 'People';
    case 'tax_unit':
      return 'Your tax unit';
    case 'family':
      return 'Your family';
    case 'spm_unit':
      return 'Your SPM unit';
    case 'marital_unit':
      return 'Your marital unit';
    case 'household':
      return 'Your household';
    case 'benunit':
      return 'Your benefit unit';
    default: {
      // Convert snake_case to sentence case
      const entityStr = entityType as string;
      const words = entityStr.replace(/_/g, ' ').split(' ');
      return `Your ${words.join(' ')}`;
    }
  }
}

/**
 * Get all person display names from household
 */
export function getAllPersonDisplayNames(household: Household): string[] {
  return household.people.map((_person, index) =>
    getPersonDisplayNameInContext(household.people, index)
  );
}
