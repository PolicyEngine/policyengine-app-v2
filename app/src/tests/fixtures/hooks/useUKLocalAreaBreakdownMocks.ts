import type { LocalAreaBreakdownResponse } from '@/api/societyWideCalculation';
import {
  BREAKDOWN_ERROR_RESPONSE,
  BREAKDOWN_REGION_SCOTLAND,
  BREAKDOWN_REGION_UK,
  BREAKDOWN_YEAR,
  EXPECTED_BREAKDOWN,
} from '@/tests/fixtures/api/localAreaBreakdownMocks';
import type { LocalAreaBreakdown } from '@/types/metadata/LocalAreaBreakdown';

export const BREAKDOWN_REFORM_POLICY_ID = '98746';
export const BREAKDOWN_BASELINE_POLICY_ID = '1';

/** A UK-wide report's breakdown request. */
export const UK_BREAKDOWN_REQUEST = {
  countryId: 'uk',
  reformPolicyId: BREAKDOWN_REFORM_POLICY_ID,
  baselinePolicyId: BREAKDOWN_BASELINE_POLICY_ID,
  region: BREAKDOWN_REGION_UK,
  year: BREAKDOWN_YEAR,
};

/** The same report for Scotland alone. */
export const SCOTLAND_BREAKDOWN_REQUEST = {
  ...UK_BREAKDOWN_REQUEST,
  region: BREAKDOWN_REGION_SCOTLAND,
};

/** The breakdown, keyed by area name, as fetchLocalAreaBreakdown returns it. */
export const NORMALIZED_BREAKDOWN = EXPECTED_BREAKDOWN as LocalAreaBreakdown;

/** fetchLocalAreaBreakdown's responses, already normalized. */
export const QUEUED_RESPONSE: LocalAreaBreakdownResponse = {
  status: 'computing',
  queue_position: 3,
  result: null,
};

export const LOADING_DATA_RESPONSE: LocalAreaBreakdownResponse = {
  status: 'computing',
  stage: 'loading_data',
  progress: 10,
  progress_max: 40,
  result: null,
};

export const COMPLETE_RESPONSE: LocalAreaBreakdownResponse = {
  status: 'ok',
  result: NORMALIZED_BREAKDOWN,
};

export const FAILED_RESPONSE: LocalAreaBreakdownResponse = {
  status: 'error',
  result: null,
  error: BREAKDOWN_ERROR_RESPONSE.error,
};

/** How often the hook polls a run that is still computing. */
export const BREAKDOWN_POLL_INTERVAL_MS = 2000;
