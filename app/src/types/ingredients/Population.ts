// import { countryIds } from '@/libs/countries';

/**
 * Base Population type containing only immutable values sent to the API
 * (Currently implemented as households in the system)
 * COMMENTED OUT - DO NOT USE YET
 * TODO: Need to confirm with Sakshi how this is implemented/broken down
 */
/*
export interface Population {
  id: number;
  countryId: (typeof countryIds)[number];
  apiVersion: string;
  populationData: PopulationData;
}

export interface PopulationData {
  people: Record<string, PopulationPerson>;
  families: Record<string, MemberGroup>;
  taxUnits: Record<string, MemberGroup>;
  spmUnits: Record<string, MemberGroup>;
  households: Record<string, MemberGroup & { stateName?: Record<string, string> }>;
  maritalUnits: Record<string, MemberGroup & { maritalUnitId?: Record<string, number> }>;
}

export interface PopulationPerson {
  age: Record<string, number>;
  employmentIncome?: Record<string, number>;
  isTaxUnitDependent?: Record<string, boolean>;
}

export interface MemberGroup {
  members: string[];
}
*/
