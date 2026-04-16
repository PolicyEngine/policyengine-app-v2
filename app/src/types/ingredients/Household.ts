import type { CountryId } from '@/libs/countries';
import type {
  AppHouseholdInputEnvelope,
  HouseholdScalar,
  HouseholdYearValueMap,
} from '@/models/household/appTypes';

/**
 * Legacy compatibility aliases.
 *
 * These names are compatibility aliases for pre-refactor app modules. They are
 * not the canonical household type entry points. New household model work should
 * import the explicit canonical/v1/v2 type families under `models/household`.
 */

export type HouseholdValue = HouseholdScalar;
export type HouseholdYearMap = HouseholdYearValueMap;

/** @deprecated Prefer `AppHouseholdInputPerson`. */
export interface HouseholdPerson {
  [key: string]: HouseholdYearMap | HouseholdValue;
}

/** @deprecated Prefer `AppHouseholdInputGroup`. */
export interface HouseholdGroupEntity {
  members: string[];
  [key: string]: HouseholdYearMap | HouseholdValue | string[];
}

export type HouseholdGroupMap = Record<string, HouseholdGroupEntity>;

/** @deprecated Prefer `AppHouseholdInputData`. */
export interface HouseholdData {
  people: Record<string, HouseholdPerson>;
  households?: HouseholdGroupMap;
  families?: HouseholdGroupMap;
  taxUnits?: HouseholdGroupMap;
  spmUnits?: HouseholdGroupMap;
  maritalUnits?: HouseholdGroupMap;
  benunits?: HouseholdGroupMap;
  tax_units?: HouseholdGroupMap;
  spm_units?: HouseholdGroupMap;
  marital_units?: HouseholdGroupMap;
}

/** @deprecated Prefer `AppHouseholdInputEnvelope`. */
export interface Household extends AppHouseholdInputEnvelope {
  id?: string;
  countryId: CountryId;
  householdData: HouseholdData;
  label?: string | null;
  year?: number | null;
}
