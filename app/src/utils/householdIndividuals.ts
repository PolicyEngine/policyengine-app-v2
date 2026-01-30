/**
 * householdIndividuals - Person and entity extraction utilities for API v2 Alpha structure
 *
 * These functions extract and format people and entity groups from the
 * array-based household structure with flat values.
 */

import { EntityType, Household, HouseholdPerson } from '@/types/ingredients/Household';
import * as HouseholdQueries from './HouseholdQueries';

/**
 * Sort people by their ID (which represents their order)
 * Person 0 = "You", Person 1 = "Your partner" or first dependent, etc.
 */
export function sortPeopleByOrder(people: HouseholdPerson[]): HouseholdPerson[] {
  return [...people].sort((a, b) => (a.person_id ?? 0) - (b.person_id ?? 0));
}

export interface EntityVariable {
  paramName: string;
  label: string;
  value: any;
  unit?: string;
}

export interface EntityMember {
  id: number;
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
 * Extract all group entities from household data
 * Returns entities like people, households, tax_units, etc.
 * Only includes group entities that have variables defined
 */
export function extractGroupEntities(
  household: Household,
  variablesMetadata?: Record<string, any>
): GroupEntity[] {
  const groupEntities: GroupEntity[] = [];

  // Extract people as a group entity
  if (household.people.length > 0) {
    const peopleInstances: GroupEntityInstance[] = household.people.map((person) => ({
      id: person.person_id ?? 0,
      name: formatPersonName(person),
      members: [extractEntityMember(person, variablesMetadata)],
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
    const entities = HouseholdQueries.getEntitiesByType(household, entityType);
    if (entities.length === 0) continue;

    const instances: GroupEntityInstance[] = [];

    for (const entity of entities) {
      // Get entity ID
      const idField = `${entityType}_id`;
      const entityId = entity[idField] as number;

      // Extract entity-level variables (excluding ID and system fields)
      const entityVariables = extractEntityVariables(entity, entityType, variablesMetadata);

      // Skip if no variables
      if (entityVariables.length === 0) continue;

      // Get members of this entity
      const members = HouseholdQueries.getPeopleInEntity(household, entityType, entityId).map(
        (person) => extractEntityMember(person, variablesMetadata)
      );

      instances.push({
        id: entityId,
        name: formatEntityInstanceName(entityType, entityId),
        members,
        variables: entityVariables,
      });
    }

    if (instances.length > 0) {
      groupEntities.push({
        entityType,
        entityTypeName: formatEntityTypeName(entityType),
        instances,
      });
    }
  }

  return groupEntities;
}

/**
 * Extract variables from an entity (not including ID fields or members)
 */
function extractEntityVariables(
  entity: Record<string, any>,
  entityType: EntityType,
  variablesMetadata?: Record<string, any>
): EntityVariable[] {
  const variables: EntityVariable[] = [];
  const idField = `${entityType}_id`;

  for (const [paramName, value] of Object.entries(entity)) {
    // Skip ID fields and undefined values
    if (paramName === idField || value === undefined) continue;

    // Skip known non-variable fields
    if (paramName.startsWith('person_')) continue;

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
  variablesMetadata?: Record<string, any>
): EntityMember {
  const variables: EntityVariable[] = [];

  for (const [paramName, value] of Object.entries(person)) {
    // Skip ID fields, name, and undefined values
    if (
      paramName === 'person_id' ||
      paramName === 'name' ||
      paramName.startsWith('person_') ||
      value === undefined
    )
      continue;

    const unit = variablesMetadata?.[paramName]?.unit;

    variables.push({
      paramName,
      label: formatParameterLabel(paramName),
      value,
      unit,
    });
  }

  return {
    id: person.person_id ?? 0,
    name: formatPersonName(person),
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
 * Format person to human-readable name
 * Uses the person's name if set, otherwise generates from ID
 */
function formatPersonName(person: HouseholdPerson): string {
  if (person.name) {
    return person.name;
  }

  const id = person.person_id ?? 0;
  if (id === 0) {
    return 'You';
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
  const ordinal = ordinals[id - 1] || `${id}th`;
  return `Your ${ordinal} dependent`;
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
 * Format entity instance name
 * For single instances, uses the entity type name
 * For multiple instances, adds ordinal
 */
function formatEntityInstanceName(entityType: EntityType, entityId: number): string {
  if (entityId === 0) {
    return formatEntityTypeName(entityType);
  }

  const ordinals = ['first', 'second', 'third', 'fourth', 'fifth'];
  const ordinal = ordinals[entityId] || `${entityId + 1}th`;
  const singularType = entityType.replace(/_/g, ' ');
  return `Your ${ordinal} ${singularType}`;
}

/**
 * Get person display name
 */
export function getPersonDisplayName(person: HouseholdPerson): string {
  return formatPersonName(person);
}

/**
 * Get all person display names from household
 */
export function getAllPersonDisplayNames(household: Household): string[] {
  return sortPeopleByOrder(household.people).map(formatPersonName);
}

/**
 * Get members of an entity group from household
 */
export function getEntityMembers(
  household: Household,
  entityType: EntityType,
  entityId: number
): HouseholdPerson[] {
  return HouseholdQueries.getPeopleInEntity(household, entityType, entityId);
}
