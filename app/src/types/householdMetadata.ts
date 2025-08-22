// Models the GET household api payload
export interface HouseholdMetadata {
  id: number;
  country_id: string;
  label?: string | null;
  api_version: string;
  household_json: HouseholdData;
  household_hash: string;
}

// Models a household's json structure that can be reused in GET and POST api payloads
export interface HouseholdData {
  people: Record<string, HouseholdPerson>;
  families: Record<string, MemberGroup>;
  tax_units: Record<string, MemberGroup>;
  spm_units: Record<string, MemberGroup>;
  households: Record<string, MemberGroup & HouseholdProperties>;
  marital_units: Record<string, MemberGroup & { marital_unit_id?: Record<string, number> }>;
  // UK-specific structure
  benunits?: Record<string, MemberGroup & { is_married?: Record<string, boolean> }>;
}

export interface HouseholdPerson {
  age: Record<string, number>;
  employment_income?: Record<string, number>;
  is_tax_unit_dependent?: Record<string, boolean>;
}

export interface MemberGroup {
  members: string[];
}

// Extended household properties to support dynamic fields
export interface HouseholdProperties {
  // US fields
  state_name?: Record<string, string>;

  // UK fields
  brma?: Record<string, string>;
  region?: Record<string, string>;
  local_authority?: Record<string, string>;

  // Allow for other dynamic fields based on basicInputs
  [key: string]: Record<string, string | number | boolean> | string[] | undefined;
}
