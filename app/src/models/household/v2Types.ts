import type { CountryId } from '@/libs/countries';

export type V2SupportedCountryId = Extract<CountryId, 'us' | 'uk'>;

export interface V2BaseHouseholdPersonData {
  name?: string;
  person_id?: number;
  [key: string]: unknown;
}

export interface V2USHouseholdPersonData extends V2BaseHouseholdPersonData {
  person_household_id?: number;
  person_family_id?: number;
  person_tax_unit_id?: number;
  person_spm_unit_id?: number;
  person_marital_unit_id?: number;
}

export interface V2UKHouseholdPersonData extends V2BaseHouseholdPersonData {
  person_household_id?: number;
  person_benunit_id?: number;
}

export type V2HouseholdPersonData = V2USHouseholdPersonData | V2UKHouseholdPersonData;

export interface V2HouseholdGroupData {
  [key: string]: unknown;
}

interface V2BaseHouseholdData<TPerson extends V2HouseholdPersonData> {
  year: number;
  label?: string | null;
  people: TPerson[];
  household: V2HouseholdGroupData[];
}

export interface V2USHouseholdData extends V2BaseHouseholdData<V2USHouseholdPersonData> {
  marital_unit: V2HouseholdGroupData[];
  family: V2HouseholdGroupData[];
  spm_unit: V2HouseholdGroupData[];
  tax_unit: V2HouseholdGroupData[];
}

export interface V2UKHouseholdData extends V2BaseHouseholdData<V2UKHouseholdPersonData> {
  benunit: V2HouseholdGroupData[];
}

export interface V2USCreateHouseholdEnvelope extends V2USHouseholdData {
  country_id: 'us';
}

export interface V2UKCreateHouseholdEnvelope extends V2UKHouseholdData {
  country_id: 'uk';
}

export type V2CreateHouseholdEnvelope = V2USCreateHouseholdEnvelope | V2UKCreateHouseholdEnvelope;

export interface V2USStoredHouseholdEnvelope extends V2USCreateHouseholdEnvelope {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface V2UKStoredHouseholdEnvelope extends V2UKCreateHouseholdEnvelope {
  id: string;
  created_at: string;
  updated_at: string;
}

export type V2StoredHouseholdEnvelope = V2USStoredHouseholdEnvelope | V2UKStoredHouseholdEnvelope;

export type V2HouseholdEnvelope = V2CreateHouseholdEnvelope | V2StoredHouseholdEnvelope;

export interface V2USHouseholdCalculationPayload extends V2USCreateHouseholdEnvelope {
  policy_id?: string;
  dynamic_id?: string;
}

export interface V2UKHouseholdCalculationPayload extends V2UKCreateHouseholdEnvelope {
  policy_id?: string;
  dynamic_id?: string;
}

export type V2HouseholdCalculationPayload =
  | V2USHouseholdCalculationPayload
  | V2UKHouseholdCalculationPayload;

interface V2BaseHouseholdCalculationResult<TPerson extends V2HouseholdPersonData> {
  person: TPerson[];
  household: V2HouseholdGroupData[];
}

export interface V2USHouseholdCalculationResult extends V2BaseHouseholdCalculationResult<V2USHouseholdPersonData> {
  marital_unit: V2HouseholdGroupData[];
  family: V2HouseholdGroupData[];
  spm_unit: V2HouseholdGroupData[];
  tax_unit: V2HouseholdGroupData[];
}

export interface V2UKHouseholdCalculationResult extends V2BaseHouseholdCalculationResult<V2UKHouseholdPersonData> {
  benunit: V2HouseholdGroupData[];
}

export type V2HouseholdCalculationResult =
  | V2USHouseholdCalculationResult
  | V2UKHouseholdCalculationResult;
