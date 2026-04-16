import type {
  AppHouseholdInputData,
  AppHouseholdInputEnvelope,
  AppHouseholdInputGroup,
  AppHouseholdInputGroupMap,
  AppHouseholdInputPerson,
  HouseholdScalar,
  HouseholdYearValueMap,
} from '@/models/household/appTypes';
import {
  buildGeneratedGroupName,
  getGroupDefinitionByAppKey,
  type HouseholdGroupAppKey,
} from '@/models/household/schema';

function normalizeAppEntityKey(entityName: string): HouseholdGroupAppKey | undefined {
  switch (entityName) {
    case 'households':
    case 'families':
    case 'taxUnits':
    case 'spmUnits':
    case 'maritalUnits':
    case 'benunits':
      return entityName;
    case 'tax_units':
      return 'taxUnits';
    case 'spm_units':
      return 'spmUnits';
    case 'marital_units':
      return 'maritalUnits';
    default:
      return undefined;
  }
}

export function isHouseholdYearMap(value: unknown): value is HouseholdYearValueMap {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function getHouseholdYearValue(
  value: AppHouseholdInputPerson[string] | AppHouseholdInputGroup[string] | undefined,
  year: string
): HouseholdScalar | undefined {
  if (!isHouseholdYearMap(value)) {
    return undefined;
  }

  return value[year];
}

export function getHouseholdGroupCollection(
  householdData: AppHouseholdInputData,
  entityName: string
): AppHouseholdInputGroupMap | undefined {
  switch (normalizeAppEntityKey(entityName)) {
    case 'households':
      return householdData.households;
    case 'families':
      return householdData.families;
    case 'taxUnits':
      return householdData.taxUnits;
    case 'spmUnits':
      return householdData.spmUnits;
    case 'maritalUnits':
      return householdData.maritalUnits;
    case 'benunits':
      return householdData.benunits;
    default:
      return undefined;
  }
}

export function getPreferredHouseholdGroupName(
  householdData: AppHouseholdInputData,
  entityName: string
): string | undefined {
  const groups = getHouseholdGroupCollection(householdData, entityName);
  if (!groups) {
    return undefined;
  }

  const groupNames = Object.keys(groups);
  if (groupNames.length === 0) {
    return undefined;
  }

  return [...groupNames].sort((left, right) => left.localeCompare(right))[0];
}

export function ensureHouseholdGroupCollection(
  householdData: AppHouseholdInputData,
  entityName: string
): AppHouseholdInputGroupMap {
  const existing = getHouseholdGroupCollection(householdData, entityName);
  if (existing) {
    return existing;
  }

  switch (normalizeAppEntityKey(entityName)) {
    case 'households':
      householdData.households = {};
      return householdData.households;
    case 'families':
      householdData.families = {};
      return householdData.families;
    case 'taxUnits':
      householdData.taxUnits = {};
      return householdData.taxUnits;
    case 'spmUnits':
      householdData.spmUnits = {};
      return householdData.spmUnits;
    case 'maritalUnits':
      householdData.maritalUnits = {};
      return householdData.maritalUnits;
    case 'benunits':
      householdData.benunits = {};
      return householdData.benunits;
    default:
      throw new Error(`Unsupported household entity group "${entityName}"`);
  }
}

export function ensureHouseholdGroupInstance(
  householdData: AppHouseholdInputData,
  entityName: string
): string {
  const existingName = getPreferredHouseholdGroupName(householdData, entityName);
  if (existingName) {
    return existingName;
  }

  const normalizedEntityKey = normalizeAppEntityKey(entityName);
  if (!normalizedEntityKey) {
    throw new Error(`Unsupported household entity group "${entityName}"`);
  }

  const groupCollection = ensureHouseholdGroupCollection(householdData, normalizedEntityKey);
  const groupDefinition = getGroupDefinitionByAppKey(normalizedEntityKey);

  if (!groupDefinition) {
    throw new Error(`Unsupported household entity group "${entityName}"`);
  }

  const peopleNames = Object.keys(householdData.people).sort((left, right) =>
    left.localeCompare(right)
  );
  let nextIndex = 0;
  let nextName = buildGeneratedGroupName(groupDefinition.generatedKeyPrefix, nextIndex);

  while (nextName in groupCollection) {
    nextIndex += 1;
    nextName = buildGeneratedGroupName(groupDefinition.generatedKeyPrefix, nextIndex);
  }

  groupCollection[nextName] = {
    members: peopleNames,
  };

  return nextName;
}

export function getAllHouseholdGroupCollections(
  householdData: AppHouseholdInputData
): Array<{ entityName: string; groups: AppHouseholdInputGroupMap }> {
  return [
    ['households', householdData.households],
    ['families', householdData.families],
    ['taxUnits', householdData.taxUnits],
    ['spmUnits', householdData.spmUnits],
    ['maritalUnits', householdData.maritalUnits],
    ['benunits', householdData.benunits],
  ]
    .filter((entry): entry is [string, AppHouseholdInputGroupMap] => Boolean(entry[1]))
    .map(([entityName, groups]) => ({ entityName, groups }));
}

export function cloneHousehold<T extends AppHouseholdInputEnvelope>(household: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(household);
  }

  return JSON.parse(JSON.stringify(household)) as T;
}
