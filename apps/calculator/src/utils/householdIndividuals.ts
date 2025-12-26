import { Household, HouseholdGroupEntity } from '@/types/ingredients/Household';

/**
 * Sort people keys in display order: you, your partner, then dependents by ordinal
 * This ensures consistent ordering across the UI regardless of object key order
 */
export function sortPeopleKeys(peopleKeys: string[]): string[] {
  const ordinalOrder = ['first', 'second', 'third', 'fourth', 'fifth'];

  return [...peopleKeys].sort((a, b) => {
    // "you" always first
    if (a === 'you') {
      return -1;
    }
    if (b === 'you') {
      return 1;
    }

    // "your partner" always second
    if (a === 'your partner') {
      return -1;
    }
    if (b === 'your partner') {
      return 1;
    }

    // Sort dependents by ordinal (first, second, third, etc.)
    const aOrdinalIndex = ordinalOrder.findIndex((ord) => a.includes(ord));
    const bOrdinalIndex = ordinalOrder.findIndex((ord) => b.includes(ord));
    if (aOrdinalIndex !== -1 && bOrdinalIndex !== -1) {
      return aOrdinalIndex - bOrdinalIndex;
    }

    // Fallback to alphabetical for any other keys
    return a.localeCompare(b);
  });
}

export interface EntityVariable {
  paramName: string;
  label: string;
  value: any;
  unit?: string; // Unit from metadata (e.g., 'currency-USD', '/1' for percentage)
}

export interface EntityMember {
  id: string;
  name: string;
  variables: EntityVariable[];
}

export interface GroupEntity {
  entityType: string; // e.g., "people", "households", "tax_units"
  entityTypeName: string; // e.g., "Your household", "Your tax unit"
  instances: GroupEntityInstance[];
}

export interface GroupEntityInstance {
  id: string;
  name: string; // e.g., "You", "Your first dependent", "Your household"
  members: EntityMember[];
  variables?: EntityVariable[]; // Entity-level variables (e.g., tax_unit.ctc)
}

/**
 * Check if a group entity has any variables (other than 'members')
 */
function hasEntityVariables(entityData: HouseholdGroupEntity): boolean {
  return Object.keys(entityData).some((key) => key !== 'members');
}

/**
 * Extract all group entities from household data
 * Returns entities like people, households, tax_units, etc.
 * Only includes group entities that have variables defined (not just members)
 */
export function extractGroupEntities(
  household: Household,
  variablesMetadata?: Record<string, any>
): GroupEntity[] {
  const groupEntities: GroupEntity[] = [];

  if (!household.householdData) {
    return groupEntities;
  }

  const { householdData } = household;

  // Iterate over all keys in householdData
  Object.entries(householdData).forEach(([entityType, entities]) => {
    if (entityType === 'people') {
      // People is special - each person is their own "instance"
      const peopleInstances: GroupEntityInstance[] = [];

      Object.entries(entities).forEach(([personId, personData]) => {
        peopleInstances.push({
          id: personId,
          name: formatPersonName(personId),
          members: [extractEntityMember(personId, personData, variablesMetadata)],
        });
      });

      groupEntities.push({
        entityType: 'people',
        entityTypeName: formatEntityTypeName('people'),
        instances: peopleInstances,
      });
    } else {
      // Group entities (households, tax_units, etc.)
      // Only include if they have variables defined
      const instances: GroupEntityInstance[] = [];

      Object.entries(entities as Record<string, HouseholdGroupEntity>).forEach(
        ([entityId, entityData]) => {
          // Skip this entity if it has no variables (only 'members')
          if (!hasEntityVariables(entityData)) {
            return;
          }

          const members = extractMembersFromGroupEntity(
            entityData,
            householdData.people,
            variablesMetadata
          );

          // Extract the entity's own variables (not member variables)
          const entityVariables = extractEntityVariables(entityData, variablesMetadata);

          instances.push({
            id: entityId,
            name: formatEntityInstanceName(entityType, entityId),
            members,
            variables: entityVariables, // Add entity-level variables
          });
        }
      );

      // Only add this entity type if it has at least one instance with variables
      if (instances.length > 0) {
        groupEntities.push({
          entityType,
          entityTypeName: formatEntityTypeName(entityType),
          instances,
        });
      }
    }
  });

  return groupEntities;
}

/**
 * Extract variables from the entity itself (not from its members)
 */
function extractEntityVariables(
  entityData: HouseholdGroupEntity,
  variablesMetadata?: Record<string, any>
): EntityVariable[] {
  const variables: EntityVariable[] = [];

  Object.entries(entityData).forEach(([paramName, paramValues]) => {
    // Skip the 'members' array - it's metadata, not a variable
    if (paramName === 'members') {
      return;
    }

    // paramValues is typically { "2024": value, "2025": value, ... }
    if (typeof paramValues === 'object' && paramValues !== null) {
      const firstValue = Object.values(paramValues)[0];
      const unit = variablesMetadata?.[paramName]?.unit;

      variables.push({
        paramName,
        label: formatParameterLabel(paramName),
        value: firstValue,
        unit,
      });
    }
  });

  return variables;
}

/**
 * Extract members from a group entity
 * Returns the people who are members of this entity with their variables
 */
export function extractMembersFromGroupEntity(
  groupEntity: HouseholdGroupEntity,
  people: Record<string, any>,
  variablesMetadata?: Record<string, any>
): EntityMember[] {
  const members: EntityMember[] = [];

  if (!groupEntity.members) {
    return members;
  }

  groupEntity.members.forEach((personId) => {
    const personData = people[personId];
    if (personData) {
      members.push(extractEntityMember(personId, personData, variablesMetadata));
    }
  });

  return members;
}

/**
 * Extract a single entity member with their variables
 */
function extractEntityMember(
  memberId: string,
  memberData: any,
  variablesMetadata?: Record<string, any>
): EntityMember {
  const variables: EntityVariable[] = [];

  Object.entries(memberData).forEach(([paramName, paramValues]) => {
    // paramValues is typically { "2024": value, "2025": value, ... }
    if (typeof paramValues === 'object' && paramValues !== null) {
      const firstValue = Object.values(paramValues)[0];
      const unit = variablesMetadata?.[paramName]?.unit;

      variables.push({
        paramName,
        label: formatParameterLabel(paramName),
        value: firstValue,
        unit,
      });
    }
  });

  return {
    id: memberId,
    name: formatPersonName(memberId),
    variables,
  };
}

/**
 * Format parameter name to human-readable label
 * Capitalizes only the first letter of the first word
 */
function formatParameterLabel(paramName: string): string {
  // Convert snake_case to sentence case (only first letter capitalized)
  const words = paramName.split('_');
  return words
    .map((word, index) => {
      // Capitalize only the first word
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      return word.toLowerCase();
    })
    .join(' ');
}

/**
 * Format person ID to human-readable name
 * Converts person_0 to "You", person_1 to "Your first dependent", etc.
 */
function formatPersonName(personId: string): string {
  const match = personId.match(/person_(\d+)/);
  if (match) {
    const index = parseInt(match[1], 10);
    if (index === 0) {
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
    const ordinal = ordinals[index - 1] || `${index}th`;
    return `Your ${ordinal} dependent`;
  }
  // Capitalize only first letter for any other format
  return personId.charAt(0).toUpperCase() + personId.slice(1).toLowerCase();
}

/**
 * Format entity type to human-readable name
 * Converts "households" to "Your household", "tax_units" to "Your tax unit", etc.
 */
function formatEntityTypeName(entityType: string): string {
  // Special cases
  if (entityType === 'people') {
    return 'People';
  }

  // Convert snake_case to sentence case and singularize
  const words = entityType.replace(/_/g, ' ').split(' ');
  const formatted = words
    .map((word) => {
      // Remove trailing 's' to singularize
      if (word.endsWith('s')) {
        return word.slice(0, -1);
      }
      return word;
    })
    .join(' ');

  return `Your ${formatted}`;
}

/**
 * Format entity instance name
 * For single instances, uses the entity type name
 * For multiple instances, adds ordinal
 */
function formatEntityInstanceName(entityType: string, entityId: string): string {
  // For households, tax_units, etc. with ID like "household_0", "tax_unit_0"
  const match = entityId.match(/_(\d+)$/);
  if (match) {
    const index = parseInt(match[1], 10);
    if (index === 0) {
      // First instance gets the simple name
      return formatEntityTypeName(entityType);
    }
    // Additional instances get ordinals
    const ordinals = ['first', 'second', 'third', 'fourth', 'fifth'];
    const ordinal = ordinals[index] || `${index + 1}th`;
    const singularType = entityType.replace(/_/g, ' ').replace(/s$/, '');
    return `Your ${ordinal} ${singularType}`;
  }

  return formatEntityTypeName(entityType);
}
