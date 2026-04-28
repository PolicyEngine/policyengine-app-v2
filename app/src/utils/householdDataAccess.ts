import type {
  AppHouseholdInputData,
  AppHouseholdInputGroup,
  AppHouseholdInputGroupMap,
  AppHouseholdInputPerson,
  HouseholdScalar,
  HouseholdYearValueMap,
} from '@/models/household/appTypes';
import { normalizeHouseholdGroupAppKey } from '@/models/household/schema';
import type {
  HouseholdCalculationData,
  HouseholdCalculationGroup,
  HouseholdCalculationGroupMap,
  HouseholdCalculationPerson,
  HouseholdCalculationValue,
  HouseholdCalculationYearValueMap,
} from '@/types/calculation/household';

type HouseholdDataLike = AppHouseholdInputData | HouseholdCalculationData;
type HouseholdPersonLike = AppHouseholdInputPerson | HouseholdCalculationPerson;
type HouseholdGroupLike = AppHouseholdInputGroup | HouseholdCalculationGroup;
type HouseholdGroupMapLike = AppHouseholdInputGroupMap | HouseholdCalculationGroupMap;
type HouseholdYearMapLike = HouseholdYearValueMap | HouseholdCalculationYearValueMap;
type HouseholdValueLike = HouseholdScalar | HouseholdCalculationValue;

export function isHouseholdYearMap(value: unknown): value is HouseholdYearMapLike {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function getHouseholdYearValue(
  value: HouseholdPersonLike[string] | HouseholdGroupLike[string] | undefined,
  year: string
): HouseholdValueLike | undefined {
  if (!isHouseholdYearMap(value)) {
    return undefined;
  }

  return value[year];
}

export function getHouseholdGroupCollection(
  householdData: HouseholdDataLike,
  entityName: string
): HouseholdGroupMapLike | undefined {
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
