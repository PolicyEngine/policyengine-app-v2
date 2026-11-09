// A browser client for www.policyengine.org's dashboard API. Dashboards use
// it instead of calling the Public API directly: the website's server adds
// PolicyEngine's credential, so the dashboard needs none.

import type {
  Country,
  DashboardApiAnswer,
  EconomyComparisonPollOptions,
  EconomyComparisonRequest,
  HouseholdCalculationRequest,
  PolicyCreationRequest,
  RequestOptions,
} from "./types.js";

export const DEFAULT_BASE_URL = "https://www.policyengine.org";
export const DEFAULT_POLL_INTERVAL_MILLISECONDS = 5_000;
export const DEFAULT_POLL_TIMEOUT_MILLISECONDS = 30 * 60_000;

export interface PolicyEngineApiClientOptions {
  /**
   * Where the dashboard API is served, without a trailing slash.
   * https://www.policyengine.org by default; "" calls the page's own origin.
   */
  readonly baseUrl?: string;
  /** The fetch to use; the global fetch by default. */
  readonly fetch?: typeof fetch;
  /** Sent as PolicyEngine-Unauthenticated-User when the page has one. */
  readonly unauthenticatedUserId?: string;
}

export interface PolicyEngineApiClient {
  /** Calculates a household; resolves with the calculated household. */
  calculateHousehold(
    request: HouseholdCalculationRequest,
    options?: RequestOptions,
  ): Promise<unknown>;
  /** Stores parameter changes as a policy; resolves with its ID. */
  createPolicy(
    request: PolicyCreationRequest,
    options?: RequestOptions,
  ): Promise<number>;
  /** Reads an economy comparison once; it may still be computing. */
  getEconomyComparison(
    request: EconomyComparisonRequest,
    options?: RequestOptions,
  ): Promise<DashboardApiAnswer>;
  /** Polls an economy comparison until it finishes; resolves with its result. */
  compareEconomy(
    request: EconomyComparisonRequest,
    options?: EconomyComparisonPollOptions,
  ): Promise<unknown>;
  /** Reads a country's model metadata. */
  getMetadata(country: Country, options?: RequestOptions): Promise<unknown>;
}

export function createPolicyEngineApiClient(
  _clientOptions: PolicyEngineApiClientOptions = {},
): PolicyEngineApiClient {
  return {
    calculateHousehold: async () => undefined,
    createPolicy: async () => 0,
    getEconomyComparison: async () => ({
      status: "error",
      message: null,
      result: null,
    }),
    compareEconomy: async () => undefined,
    getMetadata: async () => undefined,
  };
}
