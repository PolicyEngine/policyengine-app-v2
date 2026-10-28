import type { LocalAreaBreakdownResponse } from '@/api/societyWideCalculation';
import { EXPECTED_BY_CONSTITUENCY } from '@/tests/fixtures/adapters/societyWideOutputNormalizerMocks';
import {
  ARDS_AND_NORTH_DOWN,
  ARDS_AND_NORTH_DOWN_CODE,
  UNLISTED_LOCAL_AUTHORITY_NAME,
} from '@/tests/fixtures/adapters/ukLocalAreaBreakdownAdapterMocks';
import {
  BREAKDOWN_ERROR_RESPONSE,
  BREAKDOWN_REGION_SCOTLAND,
  BREAKDOWN_REGION_UK,
  BREAKDOWN_YEAR,
  EXPECTED_BREAKDOWN,
} from '@/tests/fixtures/api/localAreaBreakdownMocks';
import {
  CARDIFF_EAST_CODE,
  CARDIFF_WEST_CODE,
  SWANSEA_CODE,
} from '@/tests/fixtures/components/visualization/choropleth/ukHexLayoutMocks';
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
 * A completed breakdown that also publishes a local authority by a name
 * the Public API's region list does not use (Kingston upon Hull, which
 * the list names "Kingston upon Hull, City of"), with its ONS code.
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

/**
 * A completed UK-wide breakdown that also publishes Ards and North Down,
 * which a Public API region list from before PolicyEngine/policyengine-api#4024
 * leaves out.
 */
export const COMPLETE_RESPONSE_WITH_ARDS_AND_NORTH_DOWN: LocalAreaBreakdownResponse = {
  status: 'ok',
  result: {
    ...NORMALIZED_BREAKDOWN,
    local_authority_impact: {
      by_local_authority: {
        ...NORMALIZED_BREAKDOWN.local_authority_impact.by_local_authority,
        [ARDS_AND_NORTH_DOWN]: {
          x: 13,
          y: 39,
          average_household_income_change: 95.2,
          relative_household_income_change: 0.0031,
          code: ARDS_AND_NORTH_DOWN_CODE,
          disclosure_tier: 'reported',
        },
      },
    },
  },
};

/**
 * The local authorities that breakdown leaves out: the UK's 361, less
 * Hartlepool and Ards and North Down.
 */
export const WITHHELD_LOCAL_AUTHORITIES_WITH_ARDS_AND_NORTH_DOWN = 359;

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

/** A poll that fails before reaching the API, e.g. a gateway's 502. */
export const POLL_FAILURE = new Error('Local-area breakdown failed: 502 Bad Gateway');

/** The message the hook gives once a run computes past its time limit. */
export const TIME_LIMIT_MESSAGE =
  'The local-area breakdown is taking much longer than expected. It may still finish on the server: retry to check it again.';

/**
 * The withheld codes a UK-wide breakdown of NORMALIZED_BREAKDOWN's areas
 * lists: Cardiff East and Cardiff West of the constituencies, and Swansea
 * of the local authorities. The UK's other absent areas have no data.
 */
export const UK_LISTED_WITHHELD_CONSTITUENCY_CODES = [CARDIFF_EAST_CODE, CARDIFF_WEST_CODE];
export const UK_LISTED_WITHHELD_LOCAL_AUTHORITY_CODES = [SWANSEA_CODE];

/** NORMALIZED_BREAKDOWN with each level's list of withheld codes. */
export const BREAKDOWN_WITH_WITHHELD_LISTS: LocalAreaBreakdown = {
  ...NORMALIZED_BREAKDOWN,
  constituency_withheld_codes: UK_LISTED_WITHHELD_CONSTITUENCY_CODES,
  local_authority_withheld_codes: UK_LISTED_WITHHELD_LOCAL_AUTHORITY_CODES,
};

/** A completed UK-wide breakdown that lists each level's withheld codes. */
export const COMPLETE_RESPONSE_WITH_WITHHELD_LISTS: LocalAreaBreakdownResponse = {
  status: 'ok',
  result: BREAKDOWN_WITH_WITHHELD_LISTS,
};
