import {
  isHouseholdGroupEntityConfigured,
  normalizeHouseholdGroupAppKey,
} from '@/models/household/schema';
import type {
  HouseholdCalculationData,
  HouseholdCalculationFieldValue,
  HouseholdCalculationGroup,
  HouseholdCalculationGroupMap,
  HouseholdCalculationOutput,
  HouseholdCalculationPerson,
  HouseholdCalculationValue,
  HouseholdCalculationYearValueMap,
} from '@/types/calculation/household';
import type { MetadataState } from '@/types/metadata';

export function isHouseholdCalculationYearMap(
  value: unknown
): value is HouseholdCalculationYearValueMap {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function getHouseholdCalculationYearValue(
  value: HouseholdCalculationFieldValue | undefined,
  year: string
): HouseholdCalculationValue | undefined {
  if (!isHouseholdCalculationYearMap(value)) {
    return undefined;
  }

  return value[year];
}

export function getHouseholdCalculationGroupCollection(
  householdData: HouseholdCalculationData,
  entityName: string
): HouseholdCalculationGroupMap | undefined {
  const entityKey = normalizeHouseholdGroupAppKey(entityName);
  return entityKey ? householdData[entityKey] : undefined;
}

function getHouseholdCalculationEntityCollection(
  household: HouseholdCalculationOutput,
  entityPlural: string
): Record<string, HouseholdCalculationPerson | HouseholdCalculationGroup> | undefined {
  if (entityPlural === 'people') {
    return household.householdData.people;
  }

  return getHouseholdCalculationGroupCollection(household.householdData, entityPlural);
}

function toNumericCalculationValue(
  value: HouseholdCalculationValue | undefined
): number | number[] {
  if (typeof value === 'number') {
    return value;
  }

  if (Array.isArray(value) && value.every((item) => typeof item === 'number')) {
    return value;
  }

  return 0;
}

/**
 * Extracts a value from household-shaped calculation output.
 *
 * This reads computed result data, not editable Household model data and not a
 * v1/v2 API serialization payload. Calculation output can contain arrays from
 * axes and computed variables that native household input data cannot contain.
 */
export function getValueFromHouseholdCalculationOutput(
  variableName: string,
  timePeriod: string | null,
  entityName: string | null,
  household: HouseholdCalculationOutput,
  metadata: MetadataState,
  valueFromFirstOnly = false
): number | number[] {
  const variable = metadata.variables[variableName];
  if (!variable) {
    console.warn(`Variable ${variableName} not found in metadata`);
    return 0;
  }

  const entity = variable.entity;
  const entityPlural = metadata.entities[entity]?.plural;

  if (!entityPlural) {
    console.warn(`Entity ${entity} not found in metadata`);
    return 0;
  }

  if (
    entityPlural !== 'people' &&
    !isHouseholdGroupEntityConfigured(household.countryId, entityPlural)
  ) {
    console.warn(
      `Entity group ${entityPlural} is not configured for ${household.countryId} households`
    );
    return 0;
  }

  const entityGroup = getHouseholdCalculationEntityCollection(household, entityPlural);
  if (!entityGroup) {
    console.warn(`Entity group ${entityPlural} not found in household calculation output`);
    return 0;
  }

  if (!entityName) {
    const possibleEntities = Object.keys(entityGroup);

    if (possibleEntities.length === 0) {
      return 0;
    }

    if (possibleEntities.length === 1 || valueFromFirstOnly) {
      return getValueFromHouseholdCalculationOutput(
        variableName,
        timePeriod,
        possibleEntities[0],
        household,
        metadata,
        valueFromFirstOnly
      );
    }

    let total: number | number[] = 0;
    for (const entity of possibleEntities) {
      const entityData = getValueFromHouseholdCalculationOutput(
        variableName,
        timePeriod,
        entity,
        household,
        metadata,
        valueFromFirstOnly
      );

      if (Array.isArray(entityData)) {
        if (!Array.isArray(total)) {
          total = Array(entityData.length).fill(0);
        }
        for (let i = 0; i < entityData.length; i++) {
          total[i] += entityData[i];
        }
      } else if (Array.isArray(total)) {
        console.warn('Mixed array and scalar values in aggregation');
      } else {
        total += entityData;
      }
    }
    return total;
  }

  const entityData = entityGroup[entityName];
  if (!entityData) {
    console.warn(`Entity ${entityName} not found in ${entityPlural}`);
    return 0;
  }

  const variableData = entityData[variableName];
  if (!variableData) {
    return 0;
  }

  if (!timePeriod) {
    if (!isHouseholdCalculationYearMap(variableData)) {
      return 0;
    }
    const possibleTimePeriods = Object.keys(variableData);
    let total = 0;
    for (const period of possibleTimePeriods) {
      const periodValue = getValueFromHouseholdCalculationOutput(
        variableName,
        period,
        entityName,
        household,
        metadata,
        valueFromFirstOnly
      );
      if (typeof periodValue === 'number') {
        total += periodValue;
      }
    }
    return total;
  }

  if (!isHouseholdCalculationYearMap(variableData)) {
    return 0;
  }

  return toNumericCalculationValue(variableData[timePeriod]);
}
