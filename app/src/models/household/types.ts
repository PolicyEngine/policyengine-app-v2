import type { V2HouseholdShape } from '@/api/v2/householdCalculation';
import type { HouseholdV2Response } from '@/api/v2/households';
import type { CountryId } from '@/libs/countries';
import type { HouseholdData as IngredientHouseholdData } from '@/types/ingredients/Household';
import type { HouseholdMetadata } from '@/types/metadata/householdMetadata';
import type { HouseholdCreationPayload } from '@/types/payloads';
import type { HouseholdGroupAppKey } from './schema';

export interface HouseholdModelData {
  id: string;
  countryId: CountryId;
  label: string | null;
  year: number | null;
  data: IngredientHouseholdData;
}

export interface ComparableHousehold {
  id: string;
  countryId: CountryId;
  year: number | null;
  label: string | null;
  data: Record<string, unknown>;
}

export interface HouseholdInput {
  id?: string;
  countryId: CountryId;
  householdData: IngredientHouseholdData;
  label?: string | null;
  year?: number | null;
}

export type CanonicalEntityValues = Record<string, unknown>;

export interface CanonicalGroup {
  name: string;
  members: string[];
  values: CanonicalEntityValues;
}

export interface CanonicalHouseholdData {
  people: Record<string, CanonicalEntityValues>;
  groups: Partial<Record<HouseholdGroupAppKey, CanonicalGroup>>;
}

export interface CanonicalHouseholdState {
  id: string;
  countryId: CountryId;
  label: string | null;
  year: number | null;
  data: CanonicalHouseholdData;
}

export interface HouseholdV2Source {
  id: string;
  country_id: string;
  year: number;
  label?: string | null;
  people: HouseholdV2Response['people'];
  tax_unit?: HouseholdV2Response['tax_unit'];
  family?: HouseholdV2Response['family'];
  spm_unit?: HouseholdV2Response['spm_unit'];
  marital_unit?: HouseholdV2Response['marital_unit'];
  household?: HouseholdV2Response['household'];
  benunit?: HouseholdV2Response['benunit'];
}

export type HouseholdV1PayloadData = HouseholdCreationPayload['data'];
export type HouseholdV1Metadata = HouseholdMetadata;
export type HouseholdComparableShape = V2HouseholdShape;
