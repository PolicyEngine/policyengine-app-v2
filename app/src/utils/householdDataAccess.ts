import type {
  AppHouseholdInputData,
  AppHouseholdInputGroup,
  AppHouseholdInputGroupMap,
  AppHouseholdInputPerson,
  HouseholdScalar,
  HouseholdYearValueMap,
} from '@/models/household/appTypes';
import { normalizeHouseholdGroupAppKey } from '@/models/household/schema';

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
  switch (normalizeHouseholdGroupAppKey(entityName)) {
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
