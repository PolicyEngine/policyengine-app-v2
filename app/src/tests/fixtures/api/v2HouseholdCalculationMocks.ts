import { vi } from 'vitest';
import { createPublicApiClient } from '@/api/publicApi/client';
import type {
  V2HouseholdCalculationAxis,
  V2HouseholdCalculationItem,
  V2HouseholdCalculationOutput,
} from '@/api/v2HouseholdCalculations';
import { TEST_API_BASE } from '@/tests/fixtures/api/v2UserMocks';
import {
  US_SINGLE_PARENT_CALCULATED_SITUATION,
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
/** The .py version a calculation names (synthetic, never a published pin). */
export const V2_CALCULATION_POLICYENGINE_VERSION = '9.4.0';
const CREATED_AT = '2026-10-29T09:00:00Z';

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
  runtime_versions: { policyengine: '9.4.0', 'policyengine-us': '1.700.0' },
  years: {},
  geographies: [],
  composition_method: 'national',
  storage_method: 'inline',
};

/** A succeeded calculation's output: the household named by record IDs, with its notes. */
export function calculationOutput(
  overrides: Partial<V2HouseholdCalculationOutput> = {}
): V2HouseholdCalculationOutput {
  return {
    household: US_SINGLE_PARENT_CALCULATED_SITUATION,
    warnings: [],
    spm_config: V2_SPM_CONFIG,
    spm_provenance: V2_SPM_PROVENANCE as unknown as V2HouseholdCalculationOutput['spm_provenance'],
    policyengine_version: V2_CALCULATION_POLICYENGINE_VERSION,
    ...overrides,
  };
}

/** A calculation as `/v2/household-calculations` answers with it. */
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
    status: 'succeeded',
    created_at: CREATED_AT,
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
export function failedCalculation(message: string): V2HouseholdCalculationItem {
  return calculationItem({
    status: 'failed',
    result: null,
    error: { code: 'calculation_failed', message, detail: null },
  });
}

export function calculationResponse(item: V2HouseholdCalculationItem, status = 200): Response {
  return new Response(JSON.stringify({ status: 'ok', message: null, result: item }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export type RouteAnswer = (request: Request) => Response | Promise<Response>;

/**
 * A Public API client whose requests are answered by method and path
 * ("POST /v2/household-calculations"); answers given as a list are used in
 * turn, the last one again once they run out. An unanswered route is a 404.
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
    const list = Array.isArray(answers) ? answers : [answers];
    const index = served.get(route) ?? 0;
    served.set(route, index + 1);
    return list[Math.min(index, list.length - 1)](request);
  });
  const client = createPublicApiClient({
    baseUrl: TEST_API_BASE,
    fetchImpl: fetchMock as unknown as typeof fetch,
  });
  return { client, fetchMock };
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
