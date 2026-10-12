/**
 * Wire types for the PolicyEngine API's signed-in routes (`/v2/me*` and
 * `/v2/user-*`). Field names are snake_case, as on the wire. The server
 * derives the user from the bearer token, so request bodies never carry a
 * `user_id`; responses do.
 */

/** Countries with account storage. Every other country stays on localStorage. */
export const ASSOCIATION_COUNTRY_IDS = ['us', 'uk'] as const;
export type AssociationCountryId = (typeof ASSOCIATION_COUNTRY_IDS)[number];

export function isAssociationCountry(countryId: unknown): countryId is AssociationCountryId {
  return (
    typeof countryId === 'string' &&
    (ASSOCIATION_COUNTRY_IDS as readonly string[]).includes(countryId)
  );
}

/** `{"status": "ok", "message": null, "result": <R>}` or `{"status": "error", "message": "…"}`. */
export interface V2Envelope<R> {
  status: 'ok' | 'error';
  message: string | null;
  result?: R;
}

export interface V2ItemResult<T> {
  item: T;
}

export interface V2PageResult<T> {
  items: T[];
  offset: number;
  limit: number;
  has_more: boolean;
}

export interface MeItem {
  /** The PolicyEngine user ID that owns every association. */
  id: string;
  primary_country: AssociationCountryId;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  created_at: string;
}

export interface ProvenanceWire {
  source: 'manual' | 'chat' | 'bill' | 'tool';
  ref: string | null;
  confidence: 'exact' | 'approximated' | 'partial' | null;
}

export type BaselineWire = 'current-law' | 'current-policy';

interface AssociationItemBase {
  id: string;
  country_id: AssociationCountryId;
  user_id: string;
  name: string | null;
  description: string | null;
  client_ref: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserPolicyItem extends AssociationItemBase {
  policy_id: string | null;
  legacy_policy_id: number | null;
  baseline: BaselineWire | null;
  provenance: ProvenanceWire | null;
}

export interface UserHouseholdItem extends AssociationItemBase {
  household_id: string | null;
  legacy_household_id: number | null;
}

export interface UserSimulationItem extends AssociationItemBase {
  simulation_id: string | null;
  legacy_simulation_id: number | null;
}

export interface ReportIntervalWire {
  parameter?: string;
  start_date: string;
  end_date: string;
  value: unknown;
}

export interface ReportProvisionWire {
  path: string;
  breadcrumb: string;
  unit: string | null;
  baseline_value: unknown;
  value: unknown;
  intervals: ReportIntervalWire[] | null;
}

export interface UserReportItem extends AssociationItemBase {
  report_id: string | null;
  legacy_report_id: number | null;
  user_policy_id: string | null;
  source_note: string | null;
  provisions: ReportProvisionWire[] | null;
  /** ReportValidationWire on the wire; validated by validationFromWire. */
  validation: unknown | null;
  last_run_at: string | null;
}

/* Create and patch bodies (strict on the server: unknown keys are a 400). */

export interface UserPolicyCreateBody {
  country_id: AssociationCountryId;
  legacy_policy_id: number;
  name?: string | null;
  description?: string | null;
  baseline?: BaselineWire | null;
  provenance?: ProvenanceWire | null;
  client_ref?: string | null;
}

export type UserPolicyPatchBody = Partial<
  Pick<
    UserPolicyCreateBody,
    'legacy_policy_id' | 'name' | 'description' | 'baseline' | 'provenance'
  >
>;

export interface UserHouseholdCreateBody {
  country_id: AssociationCountryId;
  legacy_household_id: number;
  name?: string | null;
  description?: string | null;
  client_ref?: string | null;
}

export type UserHouseholdPatchBody = Partial<
  Pick<UserHouseholdCreateBody, 'legacy_household_id' | 'name' | 'description'>
>;

export interface UserSimulationCreateBody {
  country_id: AssociationCountryId;
  legacy_simulation_id: number;
  name?: string | null;
  description?: string | null;
  client_ref?: string | null;
}

export type UserSimulationPatchBody = Partial<
  Pick<UserSimulationCreateBody, 'legacy_simulation_id' | 'name' | 'description'>
>;

export interface UserReportCreateBody {
  country_id: AssociationCountryId;
  legacy_report_id: number;
  name?: string | null;
  description?: string | null;
  user_policy_id?: string | null;
  source_note?: string | null;
  provisions?: ReportProvisionWire[] | null;
  validation?: unknown | null;
  last_run_at?: string | null;
  client_ref?: string | null;
}

export type UserReportPatchBody = Partial<
  Pick<
    UserReportCreateBody,
    | 'legacy_report_id'
    | 'name'
    | 'description'
    | 'user_policy_id'
    | 'source_note'
    | 'provisions'
    | 'validation'
    | 'last_run_at'
  >
>;

/* /v2/me/export */

export interface MeExportResult {
  user: MeItem;
  policies: UserPolicyItem[];
  households: UserHouseholdItem[];
  simulations: UserSimulationItem[];
  reports: UserReportItem[];
}

/* /v2/me/imports */

export interface ImportPolicyItem {
  client_ref: string;
  legacy_policy_id: number;
  name: string | null;
  description: string | null;
  baseline: BaselineWire | null;
  provenance: ProvenanceWire | null;
}

export interface ImportHouseholdItem {
  client_ref: string;
  legacy_household_id: number;
  name: string | null;
  description: string | null;
}

export interface ImportSimulationItem {
  client_ref: string;
  legacy_simulation_id: number;
  name: string | null;
  description: string | null;
}

export interface ImportReportItem {
  client_ref: string;
  legacy_report_id: number;
  name: string | null;
  description: string | null;
  user_policy_client_ref: string | null;
  source_note: string | null;
  provisions: ReportProvisionWire[] | null;
  validation: unknown | null;
  last_run_at: string | null;
}

export interface ImportRequestBody {
  policies?: ImportPolicyItem[];
  households?: ImportHouseholdItem[];
  simulations?: ImportSimulationItem[];
  reports?: ImportReportItem[];
}

export interface ImportSkippedItem {
  /** Null when the server could not parse the item at all. */
  client_ref: string | null;
  reason: string;
}

export interface ImportResult {
  id_map: Record<string, string>;
  skipped: ImportSkippedItem[];
}
