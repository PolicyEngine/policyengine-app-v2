import type { CountryId } from '@/libs/countries';
import type { HouseholdGroupAppKey } from './schema';

export type HouseholdScalar = string | number | boolean | null;
export type CanonicalYearValueMap = Record<string, HouseholdScalar>;
export type CanonicalFieldValue = HouseholdScalar | CanonicalYearValueMap;
export type CanonicalFieldMap = Record<string, CanonicalFieldValue>;

export type CanonicalGroupSetupKey =
  | 'household'
  | 'family'
  | 'taxUnit'
  | 'spmUnit'
  | 'maritalUnit'
  | 'benunit';

export interface CanonicalHouseholdInputEnvelope {
  id?: string;
  countryId: CountryId;
  householdData: CanonicalHouseholdInputData;
  label?: string | null;
  year?: number | null;
}

export interface CanonicalHouseholdInputPerson {
  [key: string]: CanonicalFieldValue;
}

export interface CanonicalHouseholdInputGroup {
  members: string[];
  [key: string]: CanonicalFieldValue | string[];
}

export type CanonicalHouseholdInputGroupMap = Record<string, CanonicalHouseholdInputGroup>;

export interface CanonicalHouseholdInputData {
  people: Record<string, CanonicalHouseholdInputPerson>;
  households?: CanonicalHouseholdInputGroupMap;
  families?: CanonicalHouseholdInputGroupMap;
  taxUnits?: CanonicalHouseholdInputGroupMap;
  spmUnits?: CanonicalHouseholdInputGroupMap;
  maritalUnits?: CanonicalHouseholdInputGroupMap;
  benunits?: CanonicalHouseholdInputGroupMap;
}

export interface CanonicalPersonSetup {
  values: CanonicalFieldMap;
}

export interface CanonicalGroupSetup {
  name?: string;
  members: string[];
  values: CanonicalFieldMap;
}

export interface CanonicalHouseholdSetup {
  countryId: CountryId;
  label: string | null;
  year: number | null;
  people: Record<string, CanonicalPersonSetup>;
  household?: CanonicalGroupSetup | undefined;
  family?: CanonicalGroupSetup | undefined;
  taxUnit?: CanonicalGroupSetup | undefined;
  spmUnit?: CanonicalGroupSetup | undefined;
  maritalUnit?: CanonicalGroupSetup | undefined;
  benunit?: CanonicalGroupSetup | undefined;
}

export type CanonicalStructuredEntityValues = CanonicalFieldMap;

export interface CanonicalStructuredGroup {
  name: string;
  members: string[];
  values: CanonicalStructuredEntityValues;
}

export interface CanonicalStructuredHouseholdData {
  people: Record<string, CanonicalStructuredEntityValues>;
  groups: Partial<Record<HouseholdGroupAppKey, CanonicalStructuredGroup>>;
}

export interface CanonicalStructuredHouseholdState {
  id: string;
  countryId: CountryId;
  label: string | null;
  year: number | null;
  data: CanonicalStructuredHouseholdData;
}

export interface HouseholdModelData {
  id: string;
  countryId: CountryId;
  label: string | null;
  year: number | null;
  data: CanonicalHouseholdInputData;
}

export interface ComparableHousehold {
  id: string;
  countryId: CountryId;
  year: number | null;
  label: string | null;
  data: Record<string, unknown>;
}
