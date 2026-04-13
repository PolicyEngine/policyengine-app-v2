import type { CountryId } from '@/libs/countries';

export interface V2HouseholdPersonData {
  name?: string;
  person_id: number;
  person_household_id?: number;
  person_family_id?: number;
  person_tax_unit_id?: number;
  person_spm_unit_id?: number;
  person_marital_unit_id?: number;
  person_benunit_id?: number;
  [key: string]: any;
}

export interface V2HouseholdGroupData {
  [key: string]: any;
}

export interface V2HouseholdData {
  year: number;
  label?: string | null;
  people: V2HouseholdPersonData[];
  tax_unit?: V2HouseholdGroupData | null;
  family?: V2HouseholdGroupData | null;
  spm_unit?: V2HouseholdGroupData | null;
  marital_unit?: V2HouseholdGroupData | null;
  household?: V2HouseholdGroupData | null;
  benunit?: V2HouseholdGroupData | null;
}

export interface V2HouseholdShape extends V2HouseholdData {
  id?: string;
  country_id: CountryId;
}

export type V2CreateHouseholdEnvelope = Omit<V2HouseholdShape, 'id'>;

export interface V2StoredHouseholdEnvelope extends V2HouseholdShape {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface V2HouseholdCalculationPayload {
  country_id: CountryId;
  year: number;
  people: V2HouseholdPersonData[];
  tax_unit?: V2HouseholdGroupData | null;
  family?: V2HouseholdGroupData | null;
  spm_unit?: V2HouseholdGroupData | null;
  marital_unit?: V2HouseholdGroupData | null;
  household?: V2HouseholdGroupData | null;
  benunit?: V2HouseholdGroupData | null;
  policy_id?: string;
  dynamic_id?: string;
}
