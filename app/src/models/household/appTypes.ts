import type { CountryId } from '@/libs/countries';

export type HouseholdScalar = string | number | boolean | null;
export type HouseholdYearValueMap = Record<string, HouseholdScalar>;
export type HouseholdFieldValue = HouseholdScalar | HouseholdYearValueMap;

export interface AppHouseholdInputEnvelope {
  id?: string;
  countryId: CountryId;
  householdData: AppHouseholdInputData;
  label?: string | null;
  year?: number | null;
}

export interface AppHouseholdInputPerson {
  [key: string]: HouseholdFieldValue;
}

export interface AppHouseholdInputGroup {
  members: string[];
  [key: string]: HouseholdFieldValue | string[];
}

export type AppHouseholdInputGroupMap = Record<string, AppHouseholdInputGroup>;

export interface AppHouseholdInputData {
  people: Record<string, AppHouseholdInputPerson>;
  households?: AppHouseholdInputGroupMap;
  families?: AppHouseholdInputGroupMap;
  taxUnits?: AppHouseholdInputGroupMap;
  spmUnits?: AppHouseholdInputGroupMap;
  maritalUnits?: AppHouseholdInputGroupMap;
  benunits?: AppHouseholdInputGroupMap;
}

export interface HouseholdModelData {
  id: string;
  countryId: CountryId;
  label: string | null;
  year: number | null;
  householdData: AppHouseholdInputData;
}

export interface ComparableHousehold {
  id: string;
  countryId: CountryId;
  year: number | null;
  label: string | null;
  data: Record<string, unknown>;
}
