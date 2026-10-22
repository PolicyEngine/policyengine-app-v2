import { vi } from 'vitest';
import {
  LIST_SHAPE_LOCAL_AUTHORITY_IMPACT,
  UK_RESULT_OTHER_FIELDS,
} from '@/tests/fixtures/adapters/societyWideOutputNormalizerMocks';

/** The report's region and year a breakdown is asked for. */
export const BREAKDOWN_REGION_UK = 'uk';
export const BREAKDOWN_REGION_SCOTLAND = 'country/scotland';
export const BREAKDOWN_YEAR = '2026';

/**
 * A constituency that disclosure control published as approximate, with
 * its 90% intervals, in the API's list shape.
 */
export const APPROXIMATE_CONSTITUENCY_ROW = {
  average_household_income_change: 120,
  average_household_income_change_lower: 40,
  average_household_income_change_upper: 210,
  constituency_code: 'S14000021',
  constituency_name: 'East Kilbride and Strathaven',
  disclosure_tier: 'approximate',
  relative_household_income_change: 0.004,
  relative_household_income_change_lower: 0.001,
  relative_household_income_change_upper: 0.007,
  x: 30,
  y: 20,
};

/** A local authority published as reported, with its 90% intervals. */
export const REPORTED_LOCAL_AUTHORITY_ROW = {
  ...LIST_SHAPE_LOCAL_AUTHORITY_IMPACT[0],
  disclosure_tier: 'reported',
  average_household_income_change_lower: 480,
  average_household_income_change_upper: 530,
  relative_household_income_change_lower: 0.0125,
  relative_household_income_change_upper: 0.0139,
};

/** The fields a breakdown result carries besides its two lists. */
export const BREAKDOWN_PROVENANCE = {
  kind: 'local_areas',
  model_version: '2.88.0',
  policyengine_version: '6.10.0',
  dataset: 'microcosm_uk_2024_25_dense',
  data_version: '1.4.0',
};

/** A `breakdown=local_areas` result as the API returns it: lists of areas. */
export const LIST_SHAPE_BREAKDOWN_RESULT = {
  ...BREAKDOWN_PROVENANCE,
  constituency_impact: [APPROXIMATE_CONSTITUENCY_ROW],
  local_authority_impact: [REPORTED_LOCAL_AUTHORITY_ROW],
};

/** The same breakdown keyed by area name, as the app reads it. */
export const EXPECTED_BREAKDOWN = {
  ...BREAKDOWN_PROVENANCE,
  constituency_impact: {
    by_constituency: {
      'East Kilbride and Strathaven': {
        x: 30,
        y: 20,
        average_household_income_change: 120,
        relative_household_income_change: 0.004,
        code: 'S14000021',
        disclosure_tier: 'approximate',
        average_household_income_change_lower: 40,
        average_household_income_change_upper: 210,
        relative_household_income_change_lower: 0.001,
        relative_household_income_change_upper: 0.007,
      },
    },
  },
  local_authority_impact: {
    by_local_authority: {
      Hartlepool: {
        x: 8,
        y: 19,
        average_household_income_change: 503.954362,
        relative_household_income_change: 0.013174,
        code: 'E06000001',
        disclosure_tier: 'reported',
        average_household_income_change_lower: 480,
        average_household_income_change_upper: 530,
        relative_household_income_change_lower: 0.0125,
        relative_household_income_change_upper: 0.0139,
      },
    },
  },
};

/** A breakdown in which disclosure control withheld every area. */
export const EMPTY_BREAKDOWN_RESULT = {
  ...BREAKDOWN_PROVENANCE,
  constituency_impact: [],
  local_authority_impact: [],
};

/** A national UK result from .py 6.10.0 on: the area keys are absent. */
export const NATIONAL_UK_RESULT_WITHOUT_AREA_KEYS = { ...UK_RESULT_OTHER_FIELDS };

/** A national UK result whose area keys are null. */
export const NATIONAL_UK_RESULT_WITH_NULL_AREAS = {
  ...UK_RESULT_OTHER_FIELDS,
  constituency_impact: null,
  local_authority_impact: null,
};

/** The economy endpoint's envelopes for a breakdown run. */
export const BREAKDOWN_COMPUTING_RESPONSE = {
  status: 'computing',
  queue_position: 2,
  result: null,
};

export const BREAKDOWN_LOADING_DATA_RESPONSE = {
  status: 'computing',
  stage: 'loading_data',
  progress: 10,
  progress_max: 40,
  result: null,
};

export const BREAKDOWN_OK_RESPONSE = { status: 'ok', result: LIST_SHAPE_BREAKDOWN_RESULT };

export const BREAKDOWN_ERROR_RESPONSE = {
  status: 'error',
  result: null,
  error: 'The local-area run failed',
};

/** An HTTP error response whose body the test chooses. */
export function mockErrorResponseWithBody(status: number, statusText: string, body: string) {
  return { ok: false, status, statusText, text: vi.fn().mockResolvedValue(body) };
}

/** A Public API error body with a message, as JSON. */
export const BREAKDOWN_REFUSED_MESSAGE =
  'breakdown=local_areas needs .py 6.10.0 or later; this bundle runs 6.7.5';
export const BREAKDOWN_REFUSED_BODY = JSON.stringify({
  status: 'error',
  message: BREAKDOWN_REFUSED_MESSAGE,
  result: null,
});

/** An error body that is not JSON. */
export const PLAIN_TEXT_ERROR_BODY = 'upstream request timeout';
