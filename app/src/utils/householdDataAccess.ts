import type {
  Household,
  HouseholdData,
  HouseholdGroupEntity,
  HouseholdGroupMap,
  HouseholdPerson,
  HouseholdValue,
  HouseholdYearMap,
} from '@/types/ingredients/Household';

export function isHouseholdYearMap(value: unknown): value is HouseholdYearMap {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function getHouseholdYearValue(
  value: HouseholdPerson[string] | HouseholdGroupEntity[string] | undefined,
  year: string
): HouseholdValue | undefined {
  if (!isHouseholdYearMap(value)) {
    return undefined;
  }

  return value[year];
}

export function getHouseholdGroupCollection(
  householdData: HouseholdData,
  entityName: string
): HouseholdGroupMap | undefined {
  switch (entityName) {
    case 'households':
      return householdData.households;
    case 'families':
      return householdData.families;
    case 'taxUnits':
    case 'tax_units':
      return householdData.tax_units ?? householdData.taxUnits;
    case 'spmUnits':
    case 'spm_units':
      return householdData.spm_units ?? householdData.spmUnits;
    case 'maritalUnits':
    case 'marital_units':
      return householdData.marital_units ?? householdData.maritalUnits;
    case 'benunits':
      return householdData.benunits;
    default:
      return undefined;
  }
}

export function ensureHouseholdGroupCollection(
  householdData: HouseholdData,
  entityName: string
): HouseholdGroupMap {
  const existing = getHouseholdGroupCollection(householdData, entityName);
  if (existing) {
    return existing;
  }

  switch (entityName) {
    case 'households':
      householdData.households = {};
      return householdData.households;
    case 'families':
      householdData.families = {};
      return householdData.families;
    case 'taxUnits':
      householdData.taxUnits = {};
      return householdData.taxUnits;
    case 'tax_units':
      householdData.tax_units = {};
      return householdData.tax_units;
    case 'spmUnits':
      householdData.spmUnits = {};
      return householdData.spmUnits;
    case 'spm_units':
      householdData.spm_units = {};
      return householdData.spm_units;
    case 'maritalUnits':
      householdData.maritalUnits = {};
      return householdData.maritalUnits;
    case 'marital_units':
      householdData.marital_units = {};
      return householdData.marital_units;
    case 'benunits':
      householdData.benunits = {};
      return householdData.benunits;
    default:
      throw new Error(`Unsupported household entity group "${entityName}"`);
  }
}

export function getAllHouseholdGroupCollections(
  householdData: HouseholdData
): Array<{ entityName: string; groups: HouseholdGroupMap }> {
  return [
    ['households', householdData.households],
    ['families', householdData.families],
    ['taxUnits', householdData.taxUnits ?? householdData.tax_units],
    ['spmUnits', householdData.spmUnits ?? householdData.spm_units],
    ['maritalUnits', householdData.maritalUnits ?? householdData.marital_units],
    ['benunits', householdData.benunits],
  ]
    .filter((entry): entry is [string, HouseholdGroupMap] => Boolean(entry[1]))
    .map(([entityName, groups]) => ({ entityName, groups }));
}

export function cloneHousehold<T extends Household>(household: T): T {
  return JSON.parse(JSON.stringify(household)) as T;
}
