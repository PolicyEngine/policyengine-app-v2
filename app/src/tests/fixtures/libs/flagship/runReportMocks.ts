import type { ReportMetadata } from '@/types/metadata/reportMetadata';

/** A state's records, as the state district runs ask for them. */
export const CALIFORNIA_REGION = 'state/ca';
export const STATE_RECORDS_BASELINE_POLICY_ID = 2;
export const STATE_RECORDS_REFORM_POLICY_ID = 77;
export const STATE_RECORDS_YEAR = 2026;

export const CALIFORNIA_RECORDS_REQUEST = {
  region: CALIFORNIA_REGION,
  baselinePolicyId: STATE_RECORDS_BASELINE_POLICY_ID,
  reformPolicyId: STATE_RECORDS_REFORM_POLICY_ID,
  year: STATE_RECORDS_YEAR,
};

/** The simulations the Public API creates, or reuses, for them. */
export const CALIFORNIA_BASELINE_SIMULATION_ID = '301';
export const CALIFORNIA_REFORM_SIMULATION_ID = '302';

/** A base report the Public API already holds for the same simulations and year, with its result. */
export const STORED_CALIFORNIA_REPORT: ReportMetadata = {
  id: 9001,
  country_id: 'us',
  simulation_1_id: CALIFORNIA_BASELINE_SIMULATION_ID,
  simulation_2_id: CALIFORNIA_REFORM_SIMULATION_ID,
  year: String(STATE_RECORDS_YEAR),
  api_version: '1.0.0',
  status: 'complete',
  output: JSON.stringify({ budget: { budgetary_impact: -1e9 } }),
};

/**
 * The policies the reform store answers a save with: the v1 policy's ID
 * as text, and on the v2 routes the `/v2/policies` UUID. A run started
 * right after that save reuses the v1 policy.
 */
export const SAVED_REFORM_POLICY_ID = '91';
export const SAVED_REFORM_V2_POLICY_ID = '66666666-6666-4666-8666-666666666666';

/** A saved reform the run matches instead of saving a copy, and its v1 policy. */
export const MATCHING_REFORM_POLICY_ID = '64';

/** The v1 policy a parameter edit of a saved reform moves it to. */
export const UPDATED_REFORM_POLICY_ID = '92';
