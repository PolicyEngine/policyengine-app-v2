import type { FlagshipReportRecord } from '@/api/flagshipReportStore';
import type { ReportMetadata } from '@/types/metadata/reportMetadata';
import type { SimulationMetadata } from '@/types/metadata/simulationMetadata';

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
 * The policy IDs a reform store answers a save with: the v1 policy's ID
 * as text, which a run started right after that save reuses, or, from a
 * save on the v2 routes, a `/v2/policies` UUID instead.
 */
export const SAVED_REFORM_POLICY_ID = '91';
export const SAVED_REFORM_V2_POLICY_ID = '66666666-6666-4666-8666-666666666666';

/** A saved reform the run matches instead of saving a copy, and its v1 policy. */
export const MATCHING_REFORM_POLICY_ID = '64';

/** The v1 policy a parameter edit of a saved reform moves it to. */
export const UPDATED_REFORM_POLICY_ID = '92';

/**
 * A nationwide run's records as the Public API answers their creation,
 * comparing current law (policy 2) with the reform's policy (77): `POST
 * /simulation` and `POST /report` answer with the record as stored, the
 * same as reading it back.
 */
export const RUN_BASELINE_SIMULATION: SimulationMetadata = {
  id: 101,
  country_id: 'us',
  api_version: '1.0.0',
  population_id: 'us',
  population_type: 'geography',
  policy_id: '2',
  status: 'pending',
  output: null,
};
export const RUN_REFORM_SIMULATION: SimulationMetadata = {
  ...RUN_BASELINE_SIMULATION,
  id: 102,
  policy_id: '77',
};
export const RUN_REPORT: ReportMetadata = {
  id: 55,
  country_id: 'us',
  simulation_1_id: '101',
  simulation_2_id: '102',
  year: '2026',
  api_version: '1.0.0',
  status: 'pending',
  output: null,
};

/** The account's saved report as the account answers a run's write of it. */
export const RUN_SAVED_REPORT: FlagshipReportRecord = {
  id: '44444444-4444-4444-8444-444444444444',
  countryId: 'us',
  apiReportId: String(RUN_REPORT.id),
  title: 'CTC expansion',
  sourceNote: null,
  provisions: [],
  createdAt: '2026-11-17T10:00:00+00:00',
  reformId: null,
  validation: null,
  budgetWindowYears: null,
  baselineReformId: null,
};
