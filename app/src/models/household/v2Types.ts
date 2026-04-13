import type { CountryId } from '@/libs/countries';

export interface V2HouseholdPersonData {
  name?: string;
  person_id?: number;
  person_household_id?: number;
  person_family_id?: number;
  person_tax_unit_id?: number;
  person_spm_unit_id?: number;
  person_marital_unit_id?: number;
  person_benunit_id?: number;
  [key: string]: unknown;
}

export interface V2HouseholdGroupData {
  [key: string]: unknown;
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

export interface V2CreateHouseholdEnvelope extends V2HouseholdData {
  country_id: CountryId;
}

export interface V2StoredHouseholdEnvelope extends V2CreateHouseholdEnvelope {
  id: string;
  created_at: string;
  updated_at: string;
}

export type V2HouseholdEnvelope = V2CreateHouseholdEnvelope | V2StoredHouseholdEnvelope;

export interface V2HouseholdCalculationPayload extends V2CreateHouseholdEnvelope {
  policy_id?: string;
  dynamic_id?: string;
}
