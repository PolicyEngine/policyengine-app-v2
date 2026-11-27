import { vi } from 'vitest';
import { createPublicApiClient } from '@/api/publicApi/client';
import type {
  V2HouseholdCalculationAxis,
  V2HouseholdCalculationItem,
  V2HouseholdCalculationOutput,
  V2SubmittedHouseholdCalculation,
} from '@/api/v2HouseholdCalculations';
import { createV2UserClient } from '@/api/v2UserClient';
import { itemResponse, TEST_API_BASE } from '@/tests/fixtures/api/v2UserMocks';
import {
  US_SINGLE_PARENT_CALCULATED_SITUATION,
  US_SINGLE_PARENT_INPUTS_SITUATION,
  V2_CODEC_YEAR,
} from '@/tests/fixtures/models/household/v2DocumentCodecMocks';
import type { SPMProvenance, SPMSelection } from '@/types/spm';

/** Stored records the calculations name. */
export const V2_CALCULATION_IDS = {
  BASELINE: '1c1c1c1c-1c1c-4c1c-8c1c-1c1c1c1c1c1c',
  REFORM: '2c2c2c2c-2c2c-4c2c-8c2c-2c2c2c2c2c2c',
} as const;
export const V2_STORED_HOUSEHOLD_ID = '3a3a3a3a-3a3a-4a3a-8a3a-3a3a3a3a3a3a';
export const V2_REFORM_POLICY_ID = '4b4b4b4b-4b4b-4b4b-8b4b-4b4b4b4b4b4b';
export const V2_CATALOG_VERSION_ID = '5c5c5c5c-5c5c-4c5c-8c5c-5c5c5c5c5c5c';
/** The .py and country package versions a calculation runs with (synthetic, never published pins). */
export const V2_CALCULATION_POLICYENGINE_VERSION = '9.4.0';
export const V2_CALCULATION_COUNTRY_PACKAGE_VERSION = '1.700.0';
const CREATED_AT = '2026-10-29T09:00:00Z';

export const SUBMIT_CALCULATION = 'POST /v2/household-calculations';
export const readCalculation = (calculationId: string) =>
  `GET /v2/household-calculations/${calculationId}`;

/** The earnings axis the variation charts send: 401 points for the first person. */
export const EARNINGS_AXES: V2HouseholdCalculationAxis[][] = [
  [{ name: 'employment_income', period: V2_CODEC_YEAR, min: 0, max: 200000, count: 401, index: 0 }],
];

/** The SPM settings and receipt a US calculation answers with. */
export const V2_SPM_CONFIG: SPMSelection = { geography_kind: 'national', scenario: 'ce_trend' };
export const V2_SPM_PROVENANCE: SPMProvenance = {
  forecast_id: 'spm-forecast-2026',
  forecast_sha256: 'a'.repeat(64),
  scenario: 'ce_trend',
  geography_kind: 'national',
  runtime_versions: {
    policyengine: V2_CALCULATION_POLICYENGINE_VERSION,
    'policyengine-us': V2_CALCULATION_COUNTRY_PACKAGE_VERSION,
  },
  years: {},
  geographies: [],
  composition_method: 'national',
  storage_method: 'inline',
};

/** A succeeded calculation's output: the household named by record IDs, with its SPM settings and receipt. */
export function calculationOutput(
  overrides: Partial<V2HouseholdCalculationOutput> = {}
): V2HouseholdCalculationOutput {
  return {
    household: US_SINGLE_PARENT_CALCULATED_SITUATION,
    warnings: [],
    spm_config: V2_SPM_CONFIG,
    spm_provenance: V2_SPM_PROVENANCE as unknown as V2HouseholdCalculationOutput['spm_provenance'],
    ...overrides,
  };
}

/** A calculation as `GET /v2/household-calculations/{calculation_id}` answers with it. */
export function calculationItem(
  overrides: Partial<V2HouseholdCalculationItem> = {}
): V2HouseholdCalculationItem {
  return {
    calculation_id: V2_CALCULATION_IDS.BASELINE,
    country_id: 'us',
    household_id: V2_STORED_HOUSEHOLD_ID,
    policy_id: null,
    year: Number(V2_CODEC_YEAR),
    catalog_version_id: V2_CATALOG_VERSION_ID,
    country_package_version: V2_CALCULATION_COUNTRY_PACKAGE_VERSION,
    policyengine_version: V2_CALCULATION_POLICYENGINE_VERSION,
    status: 'succeeded',
    created_at: CREATED_AT,
    started_at: CREATED_AT,
    completed_at: CREATED_AT,
    result: calculationOutput(),
    error: null,
    ...overrides,
  };
}

/** A calculation still on its way: no result yet. */
export function runningCalculation(
  overrides: Partial<V2HouseholdCalculationItem> = {}
): V2HouseholdCalculationItem {
  return calculationItem({ status: 'running', completed_at: null, result: null, ...overrides });
}

/** A calculation the simulation service could not finish. */
export function failedCalculation(
  message: string,
  overrides: Partial<V2HouseholdCalculationItem> = {}
): V2HouseholdCalculationItem {
  return calculationItem({
    status: 'failed',
    result: null,
    error: { code: 'calculation_failed', message, input_errors: [], spm_error: null },
    ...overrides,
  });
}

/** What `POST /v2/household-calculations` answers for a calculation: no result, only its state. */
export function submittedCalculation(
  calculation: V2HouseholdCalculationItem
): V2SubmittedHouseholdCalculation {
  return {
    calculation_id: calculation.calculation_id,
    status: calculation.status,
    country_id: calculation.country_id,
    household_id: calculation.household_id,
    policy_id: calculation.policy_id,
    year: calculation.year,
  };
}

/** The submission's answer, 202 with the calculation's state. */
export function submittedResponse(calculation: V2HouseholdCalculationItem): Response {
  return itemResponse(submittedCalculation(calculation), 202);
}

/** A read's answer: the calculation, with its result once it has one. */
export function calculationResponse(calculation: V2HouseholdCalculationItem): Response {
  return itemResponse(calculation);
}

export type RouteAnswer = (request: Request) => Response | Promise<Response>;

/**
 * A client for API v1's generated routes, and a user client for its
 * hand-written ones, whose requests are answered by method and path ("POST
 * /v2/household-calculations"); answers given as a list are used in turn,
 * the last one again once they run out. An unanswered route is a 404.
 */
export function routedClient(routes: Record<string, RouteAnswer | RouteAnswer[]>) {
  const served = new Map<string, number>();
  const fetchMock = vi.fn(async (request: Request) => {
    const route = `${request.method} ${new URL(request.url).pathname}`;
    const answers = routes[route];
    if (!answers) {
      return new Response(JSON.stringify({ status: 'error', message: `No route ${route}` }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const answerList = Array.isArray(answers) ? answers : [answers];
    const answerIndex = served.get(route) ?? 0;
    served.set(route, answerIndex + 1);
    return answerList[Math.min(answerIndex, answerList.length - 1)](request);
  });
  const client = createPublicApiClient({
    baseUrl: TEST_API_BASE,
    fetchImpl: fetchMock as unknown as typeof fetch,
  });
  // The user client sends (url, init): routed as the same requests.
  const householdClient = createV2UserClient({
    credentials: { kind: 'none' },
    baseUrl: TEST_API_BASE,
    fetchImpl: ((url: string, init?: RequestInit) =>
      fetchMock(new Request(url, init))) as unknown as typeof fetch,
  });
  return { client, householdClient, fetchMock };
}

/** The requests a routed client sent for one route, in order. */
export function requestsFor(
  fetchMock: ReturnType<typeof routedClient>['fetchMock'],
  route: string
) {
  return fetchMock.mock.calls
    .map(([request]) => request as Request)
    .filter((request) => `${request.method} ${new URL(request.url).pathname}` === route);
}

/** Waiting between reads takes no time in tests. */
export const noWait = () => Promise.resolve();

/** The single parent's calculation under the reform: more EITC, so more net income. */
export const US_SINGLE_PARENT_REFORM_SITUATION = {
  ...US_SINGLE_PARENT_CALCULATED_SITUATION,
  households: {
    'household-1': {
      ...US_SINGLE_PARENT_CALCULATED_SITUATION.households['household-1'],
      household_net_income: { 2026: 13500 },
    },
  },
  tax_units: {
    'tax_unit-1': {
      ...US_SINGLE_PARENT_CALCULATED_SITUATION.tax_units['tax_unit-1'],
      eitc: { 2026: 5500 },
    },
  },
};

/**
 * Routes that answer the household calculations as the simulation service
 * does, by the policy each names: the baseline calculation for current law,
 * the reform's for `reformPolicyId`. A calculation adds every variable the
 * household lacks only when its submission asks; otherwise the household
 * comes back with only its stored values. Each calculation is submitted
 * running and read succeeded.
 */
export function calculationRoutesByPolicy(reformPolicyId: string): Record<string, RouteAnswer> {
  const calculations = new Map<string, V2HouseholdCalculationItem>();
  const read = (calculationId: string): RouteAnswer => () => {
    const calculation = calculations.get(calculationId);
    return calculation
      ? calculationResponse(calculation)
      : new Response(JSON.stringify({ status: 'error', message: 'Not submitted' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
  };
  return {
    [SUBMIT_CALCULATION]: async (request) => {
      const body = (await request.clone().json()) as {
        policy_id: string | null;
        add_missing_variables?: unknown;
      };
      const addsMissing = body.add_missing_variables === true;
      const reform = body.policy_id === reformPolicyId;
      const calculated = reform
        ? US_SINGLE_PARENT_REFORM_SITUATION
        : US_SINGLE_PARENT_CALCULATED_SITUATION;
      const calculationId = reform ? V2_CALCULATION_IDS.REFORM : V2_CALCULATION_IDS.BASELINE;
      const calculation = calculationItem({
        calculation_id: calculationId,
        policy_id: body.policy_id,
        result: calculationOutput({
          household: addsMissing ? calculated : US_SINGLE_PARENT_INPUTS_SITUATION,
        }),
      });
      calculations.set(calculationId, calculation);
      return submittedResponse({ ...calculation, status: 'running' });
    },
    [readCalculation(V2_CALCULATION_IDS.BASELINE)]: read(V2_CALCULATION_IDS.BASELINE),
    [readCalculation(V2_CALCULATION_IDS.REFORM)]: read(V2_CALCULATION_IDS.REFORM),
  };
}
