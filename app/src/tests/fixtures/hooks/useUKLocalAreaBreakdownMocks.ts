import type { LocalAreaBreakdownResponse } from '@/api/societyWideCalculation';
import { EXPECTED_BY_CONSTITUENCY } from '@/tests/fixtures/adapters/societyWideOutputNormalizerMocks';
import { UNLISTED_LOCAL_AUTHORITY_NAME } from '@/tests/fixtures/adapters/ukLocalAreaBreakdownAdapterMocks';
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

/** Another year of the same report's budget window. */
export const OTHER_BREAKDOWN_YEAR = '2027';

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

/**
 * A completed breakdown that also publishes a local authority the region
 * metadata does not list, so its local authorities cannot be counted.
 */
export const COMPLETE_RESPONSE_WITH_UNLISTED_LOCAL_AUTHORITY: LocalAreaBreakdownResponse = {
  status: 'ok',
  result: {
    ...NORMALIZED_BREAKDOWN,
    local_authority_impact: {
      by_local_authority: {
        ...NORMALIZED_BREAKDOWN.local_authority_impact.by_local_authority,
        [UNLISTED_LOCAL_AUTHORITY_NAME]: {
          x: 10,
          y: 15,
          average_household_income_change: 310.5,
          relative_household_income_change: 0.0091,
          code: 'E06000010',
          disclosure_tier: 'reported',
        },
      },
    },
  },
};

export const FAILED_RESPONSE: LocalAreaBreakdownResponse = {
  status: 'error',
  result: null,
  error: BREAKDOWN_ERROR_RESPONSE.error,
};

/** How often the hook polls a run that is still computing. */
export const BREAKDOWN_POLL_INTERVAL_MS = 2000;

/**
 * An ok response whose result is a national result, not a breakdown: what
 * a Public API deployment that ignores breakdown=local_areas returns.
 */
export const NATIONAL_RESULT_FOR_BREAKDOWN_RESPONSE = {
  status: 'ok',
  result: {
    budget: { budgetary_impact: -1e9 },
    constituency_impact: { by_constituency: EXPECTED_BY_CONSTITUENCY },
  },
} as unknown as LocalAreaBreakdownResponse;

/** The message the hook gives for such a response. */
export const NOT_A_BREAKDOWN_MESSAGE =
  'The API returned national results instead of a local-area breakdown. Its deployment may not support breakdown=local_areas yet.';
