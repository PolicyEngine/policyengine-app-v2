import type { SPMSelection } from '@/types/spm';
import type { AssociationCountryId } from '@/types/v2User';

/**
 * Wire types for the Public API's v2 household routes: immutable,
 * deduplicated household content (`/v2/households`) and the user's saved
 * households that point at it (`/v2/user-households`). Field names are
 * snake_case, as on the wire.
 */

/** One group in a household (a tax unit, a benefit unit…): its id and its values. */
export interface V2HouseholdEntityRecord {
  /** Unique within its collection; people's memberships refer to it. */
  id: string;
  /** The group's name in the v1 household it came from ("your tax unit"). */
  source_name?: string | null;
  /** Variable name → value, each keyed by period as in a v1 household. */
  values: Record<string, unknown>;
}

/** One person: their values, and the group they belong to in every collection. */
export interface V2HouseholdPersonRecord extends V2HouseholdEntityRecord {
  /** Collection ("tax_unit") → the id of the person's group in it; names every collection. */
  memberships: Record<string, string>;
}

export interface V2USHouseholdDocument {
  people: V2HouseholdPersonRecord[];
  household: V2HouseholdEntityRecord[];
  family: V2HouseholdEntityRecord[];
  tax_unit: V2HouseholdEntityRecord[];
  spm_unit: V2HouseholdEntityRecord[];
  marital_unit: V2HouseholdEntityRecord[];
  /** The SPM settings; left out (never null) when none are chosen. */
  spm?: SPMSelection;
}

export interface V2UKHouseholdDocument {
  people: V2HouseholdPersonRecord[];
  household: V2HouseholdEntityRecord[];
  benunit: V2HouseholdEntityRecord[];
}

export type V2HouseholdDocument = V2USHouseholdDocument | V2UKHouseholdDocument;

/** `POST /v2/households`: strict on the server, with no label or other presentation field. */
export interface V2HouseholdCreateBody {
  country_id: AssociationCountryId;
  /** The year that values without an explicit period are read in (1900–2200). */
  default_year: number;
  household_data: V2HouseholdDocument;
}

/** A stored household. Creating identical content returns the existing one, with its id. */
export interface V2HouseholdItem {
  id: string;
  country_id: AssociationCountryId;
  default_year: number | null;
  household_data: V2HouseholdDocument;
  created_at: string;
  updated_at: string;
}

/** A household the user saved: their name for it, and the household it points at. */
export interface UserHouseholdItem {
  id: string;
  country_id: AssociationCountryId;
  user_id: string;
  /** The v2 household; null for a row that only names a v1 household. */
  household_id: string | null;
  legacy_household_id: number | null;
  name: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

/** `POST /v2/user-households`: a v2 household_id, a v1 legacy_household_id, or both. */
export interface UserHouseholdCreateBody {
  country_id: AssociationCountryId;
  household_id?: string | null;
  legacy_household_id?: number | null;
  name?: string | null;
  description?: string | null;
}

/**
 * `PATCH /v2/user-households/{id}`: only these fields. The route cannot
 * point a row at another v2 household (it has no household_id field), so
 * the saved-household store repoints a row by replacing it.
 */
export interface UserHouseholdPatchBody {
  legacy_household_id?: number;
  name?: string | null;
  description?: string | null;
}
