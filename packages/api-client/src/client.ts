// A browser client for www.policyengine.org's dashboard API. Dashboards use
// it instead of calling the Public API directly: the website's server adds
// PolicyEngine's credential, so the dashboard needs none.

import {
  EconomyComparisonTimeoutError,
  PolicyEngineApiError,
} from "./errors.js";
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

/** Answers that polling waits out and retries, up to this many in a row. */
const RETRIED_POLL_STATUSES = new Set([429, 502, 503, 504]);
const MAXIMUM_CONSECUTIVE_POLL_RETRIES = 3;

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

function retryAfterSeconds(response: Response): number | null {
  const value = response.headers.get("retry-after");
  if (value === null) {
    return null;
  }
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : null;
}

function messageFrom(body: unknown, fallback: string): string {
  if (typeof body === "object" && body !== null) {
    const message = (body as { message?: unknown }).message;
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
  }
  return fallback;
}

function waitFor(milliseconds: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, milliseconds);
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal?.reason);
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export function createPolicyEngineApiClient(
  clientOptions: PolicyEngineApiClientOptions = {},
): PolicyEngineApiClient {
  const baseUrl = (clientOptions.baseUrl ?? DEFAULT_BASE_URL).replace(
    /\/+$/,
    "",
  );
  const fetchImplementation: typeof fetch =
    clientOptions.fetch ?? ((input, init) => globalThis.fetch(input, init));

  async function send(
    method: "GET" | "POST",
    path: string,
    body: unknown,
    signal: AbortSignal | undefined,
  ): Promise<{ response: Response; body: unknown }> {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }
    if (clientOptions.unauthenticatedUserId) {
      headers["PolicyEngine-Unauthenticated-User"] =
        clientOptions.unauthenticatedUserId;
    }

    let response: Response;
    try {
      response = await fetchImplementation(`${baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        // The dashboard API reads no cookies.
        credentials: "omit",
        signal,
      });
    } catch (error) {
      if (signal?.aborted) {
        throw error;
      }
      throw new PolicyEngineApiError(
        `The dashboard API could not be reached: ${error instanceof Error ? error.message : String(error)}`,
        null,
      );
    }

    const answerBody: unknown = await response.json().catch(() => null);
    return { response, body: answerBody };
  }

  function refusal(response: Response, body: unknown): PolicyEngineApiError {
    return new PolicyEngineApiError(
      messageFrom(body, `The dashboard API answered HTTP ${response.status}.`),
      response.status,
      body,
      retryAfterSeconds(response),
    );
  }

  /** The result of an "ok" answer; anything else is thrown. */
  async function okResult(
    method: "GET" | "POST",
    path: string,
    body: unknown,
    signal: AbortSignal | undefined,
  ): Promise<unknown> {
    const answer = await send(method, path, body, signal);
    const status = (answer.body as { status?: unknown } | null)?.status;
    if (!answer.response.ok || status !== "ok") {
      throw refusal(answer.response, answer.body);
    }
    return (answer.body as DashboardApiAnswer).result;
  }

  function economyComparisonPath(request: EconomyComparisonRequest): string {
    const query = new URLSearchParams({
      country: request.country,
      policy: String(request.policy),
      baseline: String(request.baseline),
      region: request.region,
      year: String(request.year),
    });
    return `/api/economy/compare?${query.toString()}`;
  }

  async function getEconomyComparison(
    request: EconomyComparisonRequest,
    options: RequestOptions = {},
  ): Promise<DashboardApiAnswer> {
    const answer = await send(
      "GET",
      economyComparisonPath(request),
      undefined,
      options.signal,
    );
    const status = (answer.body as { status?: unknown } | null)?.status;
    if (
      !answer.response.ok ||
      (status !== "ok" && status !== "computing" && status !== "error")
    ) {
      throw refusal(answer.response, answer.body);
    }
    return answer.body as DashboardApiAnswer;
  }

  async function compareEconomy(
    request: EconomyComparisonRequest,
    options: EconomyComparisonPollOptions = {},
  ): Promise<unknown> {
    const intervalMilliseconds =
      options.intervalMilliseconds ?? DEFAULT_POLL_INTERVAL_MILLISECONDS;
    const deadline =
      Date.now() +
      (options.timeoutMilliseconds ?? DEFAULT_POLL_TIMEOUT_MILLISECONDS);
    let consecutiveRetries = 0;

    for (;;) {
      let answer: DashboardApiAnswer;
      try {
        answer = await getEconomyComparison(request, {
          signal: options.signal,
        });
        consecutiveRetries = 0;
      } catch (error) {
        // Rate limiting and brief gateway failures are waited out; anything
        // else, or a fourth retry in a row, ends polling.
        if (
          !(error instanceof PolicyEngineApiError) ||
          error.status === null ||
          !RETRIED_POLL_STATUSES.has(error.status) ||
          consecutiveRetries >= MAXIMUM_CONSECUTIVE_POLL_RETRIES
        ) {
          throw error;
        }
        consecutiveRetries += 1;
        const waitMilliseconds =
          error.retryAfterSeconds !== null
            ? error.retryAfterSeconds * 1000
            : intervalMilliseconds;
        if (Date.now() + waitMilliseconds > deadline) {
          throw new EconomyComparisonTimeoutError(
            "The economy comparison did not finish in time.",
          );
        }
        await waitFor(waitMilliseconds, options.signal);
        continue;
      }

      if (answer.status === "ok") {
        return answer.result;
      }
      if (answer.status === "error") {
        throw new PolicyEngineApiError(
          messageFrom(answer, "The economy comparison failed."),
          200,
          answer,
        );
      }
      options.onProgress?.(answer);
      if (Date.now() + intervalMilliseconds > deadline) {
        throw new EconomyComparisonTimeoutError(
          "The economy comparison did not finish in time.",
        );
      }
      await waitFor(intervalMilliseconds, options.signal);
    }
  }

  return {
    calculateHousehold: (request, options = {}) =>
      okResult(
        "POST",
        "/api/household/calculate",
        {
          country: request.country,
          household: request.household,
          ...(request.policy === undefined ? {} : { policy: request.policy }),
        },
        options.signal,
      ),

    async createPolicy(request, options = {}) {
      const answer = await send(
        "POST",
        "/api/policies",
        { country: request.country, parameters: request.parameters },
        options.signal,
      );
      const policyId = (answer.body as { id?: unknown } | null)?.id;
      if (!answer.response.ok || typeof policyId !== "number") {
        throw refusal(answer.response, answer.body);
      }
      return policyId;
    },

    getEconomyComparison,
    compareEconomy,

    getMetadata: (country, options = {}) =>
      okResult(
        "GET",
        `/api/metadata/${encodeURIComponent(country)}`,
        undefined,
        options.signal,
      ),
  };
}
