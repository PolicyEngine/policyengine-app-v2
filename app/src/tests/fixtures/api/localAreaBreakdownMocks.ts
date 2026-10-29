import { vi } from 'vitest';
import {
  fetchSocietyWideCalculation,
  type PolicyEngineBundle,
  type SocietyWideReportOutput,
} from '@/api/societyWideCalculation';
import {
  LIST_SHAPE_CONSTITUENCY_IMPACT,
  LIST_SHAPE_LOCAL_AUTHORITY_IMPACT,
  UK_RESULT_OTHER_FIELDS,
} from '@/tests/fixtures/adapters/societyWideOutputNormalizerMocks';
import { createMockSocietyWideOutput } from '@/tests/fixtures/pages/reportOutputMocks';

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

/**
 * The withheld ONS codes a breakdown result lists, sorted, as the
 * simulation API gives them (PolicyEngine/policyengine-sim-api#968): two
 * constituencies, Cardiff East and Cardiff West, and no local authority.
 */
export const LISTED_CONSTITUENCY_WITHHELD_CODES = ['W07000089', 'W07000092'];
export const LISTED_LOCAL_AUTHORITY_WITHHELD_CODES: string[] = [];

/** A `breakdown=local_areas` result that also lists each level's withheld codes. */
export const LIST_SHAPE_BREAKDOWN_RESULT_WITH_WITHHELD_CODES = {
  ...LIST_SHAPE_BREAKDOWN_RESULT,
  constituency_withheld_codes: LISTED_CONSTITUENCY_WITHHELD_CODES,
  local_authority_withheld_codes: LISTED_LOCAL_AUTHORITY_WITHHELD_CODES,
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

/**
 * The name of the simulation API app that ran a result, which the Public
 * API adds to the result beside its bundle.
 */
export const UK_RESOLVED_APP_NAME = 'policyengine-uk-2-88-0';

/** The bundle inside a UK result computed on .py 6.10.0, the first release with breakdowns. */
export const BREAKDOWN_RELEASE_BUNDLE: PolicyEngineBundle = {
  model_version: '2.88.0',
  policyengine_version: '6.10.0',
  data_version: '1.4.0',
  dataset: 'hf://policyengine/policyengine-uk-data-private/enhanced_frs_2023_24.h5@1.4.0',
};

/** The bundle inside a UK result computed on .py 6.7.5, before breakdowns. */
export const OLDER_RELEASE_BUNDLE: PolicyEngineBundle = {
  model_version: '2.39.0',
  policyengine_version: '6.7.5',
  data_version: '1.2.0',
  dataset: 'hf://policyengine/policyengine-uk-data-private/enhanced_frs_2023_24.h5@1.2.0',
};

/**
 * The bundle the Public API gives a stored result it cannot tie to a
 * simulation app: no model or .py version, only the data.
 */
export const BUNDLE_WITHOUT_VERSIONS: PolicyEngineBundle = {
  model_version: null,
  policyengine_version: null,
  data_version: BREAKDOWN_RELEASE_BUNDLE.data_version,
  dataset: BREAKDOWN_RELEASE_BUNDLE.dataset,
};

/** The bundle inside a breakdown result: the breakdown's own versions and dataset. */
export const BREAKDOWN_BUNDLE: PolicyEngineBundle = {
  model_version: BREAKDOWN_PROVENANCE.model_version,
  policyengine_version: BREAKDOWN_PROVENANCE.policyengine_version,
  data_version: BREAKDOWN_PROVENANCE.data_version,
  dataset: BREAKDOWN_PROVENANCE.dataset,
};

/**
 * An ok economy response body in the Public API's shape. Its economy route
 * returns `{ status, message, result }`, and its economy service
 * (`EconomyService._with_policyengine_bundle`) adds `policyengine_bundle`
 * and `resolved_app_name` inside `result`, not beside it.
 */
function publicAPIOkBody<SimulationResult extends object>(
  simulationResult: SimulationResult,
  bundle: PolicyEngineBundle
) {
  return {
    status: 'ok' as const,
    message: null,
    result: {
      ...simulationResult,
      policyengine_bundle: bundle,
      resolved_app_name: UK_RESOLVED_APP_NAME,
    },
  };
}

/**
 * The Public API's body for a national UK result from .py 6.10.0. The
 * simulation API's result has no constituency or local authority keys and
 * no .py version of its own: the version is only in the bundle.
 */
export const NATIONAL_UK_BODY_FROM_BREAKDOWN_RELEASE = publicAPIOkBody(
  createMockSocietyWideOutput(),
  BREAKDOWN_RELEASE_BUNDLE
);

/** The Public API's body for a .py 6.7.5 UK result, which holds its area impacts as lists. */
export const OLDER_UK_BODY_WITH_AREAS = publicAPIOkBody(
  {
    ...createMockSocietyWideOutput(),
    constituency_impact: LIST_SHAPE_CONSTITUENCY_IMPACT,
    local_authority_impact: LIST_SHAPE_LOCAL_AUTHORITY_IMPACT,
  },
  OLDER_RELEASE_BUNDLE
);

/**
 * The Public API's body for a stored breakdown it cannot tie to a
 * simulation app: the bundle has no versions, and the result keeps its own.
 */
export const BREAKDOWN_BODY_WITHOUT_BUNDLE_VERSIONS = publicAPIOkBody(
  LIST_SHAPE_BREAKDOWN_RESULT,
  BUNDLE_WITHOUT_VERSIONS
);

/** The Public API's body for a completed breakdown. */
export const BREAKDOWN_OK_RESPONSE = publicAPIOkBody(LIST_SHAPE_BREAKDOWN_RESULT, BREAKDOWN_BUNDLE);

/** The completed breakdown as fetchLocalAreaBreakdown returns it: keyed by name, with the bundle. */
export const EXPECTED_BREAKDOWN_WITH_BUNDLE = {
  ...EXPECTED_BREAKDOWN,
  policyengine_bundle: BREAKDOWN_BUNDLE,
  resolved_app_name: UK_RESOLVED_APP_NAME,
};

/** A national request's policies; its result does not depend on them here. */
const NATIONAL_REQUEST_POLICY_IDS = { reform: '98746', baseline: '1' };

/**
 * The national result the app keeps from a Public API economy response
 * body: what fetchSocietyWideCalculation returns for a UK-wide report when
 * the API answers with the body.
 */
export async function nationalResultFromBody(body: unknown): Promise<SocietyWideReportOutput> {
  const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json(body));
  try {
    const response = await fetchSocietyWideCalculation(
      'uk',
      NATIONAL_REQUEST_POLICY_IDS.reform,
      NATIONAL_REQUEST_POLICY_IDS.baseline,
      { region: BREAKDOWN_REGION_UK, time_period: BREAKDOWN_YEAR }
    );
    return response.result as SocietyWideReportOutput;
  } finally {
    fetchSpy.mockRestore();
  }
}

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
