import type { CountryId } from '@/libs/countries';
import type {
  CanonicalHouseholdInputEnvelope,
  CanonicalYearValueMap,
  HouseholdScalar,
} from '@/models/household/canonicalTypes';

/**
 * Legacy compatibility aliases.
 *
 * These names are compatibility aliases for pre-refactor app modules. They are
 * not the canonical household type entry points. New household model work should
 * import the explicit canonical/v1/v2 type families under `models/household`.
 */

export type HouseholdValue = HouseholdScalar;
export type HouseholdYearMap = CanonicalYearValueMap;

/** @deprecated Prefer `CanonicalHouseholdInputPerson`. */
export interface HouseholdPerson {
  [key: string]: HouseholdYearMap | HouseholdValue;
}

/** @deprecated Prefer `CanonicalHouseholdInputGroup`. */
export interface HouseholdGroupEntity {
  members: string[];
  [key: string]: HouseholdYearMap | HouseholdValue | string[];
}

export type HouseholdGroupMap = Record<string, HouseholdGroupEntity>;

/** @deprecated Prefer `CanonicalHouseholdInputData`. */
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

/** @deprecated Prefer `CanonicalHouseholdInputEnvelope`. */
export interface Household extends CanonicalHouseholdInputEnvelope {
  id?: string;
  countryId: CountryId;
  householdData: HouseholdData;
  label?: string | null;
  year?: number | null;
}
