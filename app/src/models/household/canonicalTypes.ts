import type { CountryId } from '@/libs/countries';
import type { HouseholdGroupAppKey } from './schema';

export interface CanonicalHouseholdInputEnvelope {
  id?: string;
  countryId: CountryId;
  householdData: CanonicalHouseholdInputData;
  label?: string | null;
  year?: number | null;
}

export interface CanonicalHouseholdInputData {
  people: Record<string, CanonicalHouseholdInputPerson>;
  [groupEntity: string]:
    | Record<string, CanonicalHouseholdInputGroup>
    | Record<string, CanonicalHouseholdInputPerson>;
}

export interface CanonicalHouseholdInputPerson {
  [key: string]: any;
}

export interface CanonicalHouseholdInputGroup {
  members: string[];
  [key: string]: any;
}

export interface CanonicalPersonSetup {
  values: Record<string, unknown>;
}

export interface CanonicalGroupSetup {
  members: string[];
  values: Record<string, unknown>;
}

export interface CanonicalHouseholdSetup {
  countryId: CountryId;
  label: string | null;
  year: number | null;
  people: Record<string, CanonicalPersonSetup>;
  household?: CanonicalGroupSetup;
  family?: CanonicalGroupSetup;
  taxUnit?: CanonicalGroupSetup;
  spmUnit?: CanonicalGroupSetup;
  maritalUnit?: CanonicalGroupSetup;
  benunit?: CanonicalGroupSetup;
}

export type CanonicalStructuredEntityValues = Record<string, unknown>;

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
