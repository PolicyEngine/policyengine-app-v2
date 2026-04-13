export interface V1HouseholdMetadataEnvelope {
  id: string;
  country_id: string;
  label?: string | null;
  api_version: string;
  household_json: V1HouseholdData;
  household_hash: string;
}

export interface V1HouseholdData {
  people: Record<string, V1HouseholdPersonData>;
  families: Record<string, V1HouseholdGroupData>;
  tax_units: Record<string, V1HouseholdGroupData>;
  spm_units: Record<string, V1HouseholdGroupData>;
  households: Record<string, V1HouseholdGroupData>;
  marital_units: Record<string, V1HouseholdGroupData>;
  benunits?: Record<string, V1HouseholdGroupData>;
}

export interface V1HouseholdPersonData {
  [key: string]: Record<string, string | number | boolean> | undefined;
}

export interface V1HouseholdMemberGroup {
  members: string[];
}

export interface V1HouseholdGroupProperties {
  [key: string]: Record<string, string | number | boolean> | undefined;
}

export type V1HouseholdGroupData = V1HouseholdMemberGroup & {
  [key: string]:
    | Record<string, string | number | boolean>
    | string[]
    | undefined;
};

export interface V1HouseholdCreateEnvelope {
  country_id: string;
  data: V1HouseholdData;
  label?: string;
}
