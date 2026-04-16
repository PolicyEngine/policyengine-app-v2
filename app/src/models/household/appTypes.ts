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

export interface AppUSHouseholdInputData {
  people: Record<string, AppHouseholdInputPerson>;
  households?: AppHouseholdInputGroupMap;
  families?: AppHouseholdInputGroupMap;
  taxUnits?: AppHouseholdInputGroupMap;
  spmUnits?: AppHouseholdInputGroupMap;
  maritalUnits?: AppHouseholdInputGroupMap;
}

export interface AppUKHouseholdInputData {
  people: Record<string, AppHouseholdInputPerson>;
  households?: AppHouseholdInputGroupMap;
  benunits?: AppHouseholdInputGroupMap;
}

export interface AppUSHouseholdInputEnvelope {
  id?: string;
  countryId: 'us';
  householdData: AppUSHouseholdInputData;
  label?: string | null;
  year?: number | null;
}

export interface AppUKHouseholdInputEnvelope {
  id?: string;
  countryId: 'uk';
  householdData: AppUKHouseholdInputData;
  label?: string | null;
  year?: number | null;
}

export type SupportedV2AppHouseholdInputEnvelope =
  | AppUSHouseholdInputEnvelope
  | AppUKHouseholdInputEnvelope;

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
