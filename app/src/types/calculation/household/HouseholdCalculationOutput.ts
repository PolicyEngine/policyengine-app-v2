import type { CountryId } from '@/libs/countries';

export type HouseholdCalculationScalar = string | number | boolean | null;
export type HouseholdCalculationArray = string[] | number[] | boolean[];
export type HouseholdCalculationValue = HouseholdCalculationScalar | HouseholdCalculationArray;
export type HouseholdCalculationYearValueMap = Record<string, HouseholdCalculationValue>;
export type HouseholdCalculationFieldValue =
  | HouseholdCalculationValue
  | HouseholdCalculationYearValueMap;

export interface HouseholdCalculationPerson {
  [key: string]: HouseholdCalculationFieldValue;
}

export interface HouseholdCalculationGroup {
  members: string[];
  [key: string]: HouseholdCalculationFieldValue | string[];
}

export type HouseholdCalculationGroupMap = Record<string, HouseholdCalculationGroup>;

/**
 * Household-shaped calculation result data.
 *
 * This is not the editable Household model and not a v1/v2 API serialization
 * payload. Calculation results may include computed variables and variation
 * arrays, so they need a wider value type than builder input data.
 */
export interface HouseholdCalculationData {
  people: Record<string, HouseholdCalculationPerson>;
  households?: HouseholdCalculationGroupMap;
  families?: HouseholdCalculationGroupMap;
  taxUnits?: HouseholdCalculationGroupMap;
  spmUnits?: HouseholdCalculationGroupMap;
  maritalUnits?: HouseholdCalculationGroupMap;
  benunits?: HouseholdCalculationGroupMap;
}

export interface HouseholdCalculationOutput {
  id?: string;
  countryId: CountryId;
  householdData: HouseholdCalculationData;
  label?: string | null;
  year?: number | null;
}
