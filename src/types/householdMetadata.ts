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
  households: Record<string, MemberGroup & { state_name?: Record<string, string> }>; // TODO: Import state names as constants based on metadata
  marital_units: Record<string, MemberGroup & { marital_unit_id?: Record<string, number> }>;
}

export interface HouseholdPerson {
  age: Record<string, number>;
  employment_income?: Record<string, number>;
  is_tax_unit_dependent?: Record<string, boolean>;
}

// TODO members could be enumerated?
export interface MemberGroup {
  members: string[];
}

// Models the POST household api payload
export interface HouseholdCreationPayload {
  data: HouseholdData;
}
