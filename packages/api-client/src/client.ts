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
  /**
   * Calculates a household; resolves with the calculated household. The
   * type argument names its shape; it is not checked at run time.
   */
  calculateHousehold<Result = unknown>(
    request: HouseholdCalculationRequest,
    options?: RequestOptions,
  ): Promise<Result>;
  /** Stores parameter changes as a policy; resolves with its ID. */
  createPolicy(
    request: PolicyCreationRequest,
    options?: RequestOptions,
  ): Promise<number>;
  /** Reads an economy comparison once; it may still be computing. */
  getEconomyComparison<Result = unknown>(
    request: EconomyComparisonRequest,
    options?: RequestOptions,
  ): Promise<DashboardApiAnswer<Result>>;
  /** Polls an economy comparison until it finishes; resolves with its result. */
  compareEconomy<Result = unknown>(
    request: EconomyComparisonRequest,
    options?: EconomyComparisonPollOptions,
  ): Promise<Result>;
  /** Reads a country's model metadata. */
  getMetadata<Result = unknown>(
    country: Country,
    options?: RequestOptions,
  ): Promise<Result>;
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

    // Read the whole answer first, so that an abort or a dropped connection
    // while it arrives is not mistaken for an answer that is not JSON.
    let answerText: string;
    try {
      answerText = await response.text();
    } catch (error) {
      if (signal?.aborted) {
        throw error;
      }
      throw new PolicyEngineApiError(
        `The dashboard API's answer could not be read: ${error instanceof Error ? error.message : String(error)}`,
        null,
      );
    }
    let answerBody: unknown = null;
    try {
      answerBody = answerText === "" ? null : JSON.parse(answerText);
    } catch {
      // Not JSON, such as a platform error page; the status still tells.
    }
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
  async function okResult<Result>(
    method: "GET" | "POST",
    path: string,
    body: unknown,
    signal: AbortSignal | undefined,
  ): Promise<Result> {
    const answer = await send(method, path, body, signal);
    const status = (answer.body as { status?: unknown } | null)?.status;
    if (!answer.response.ok || status !== "ok") {
      throw refusal(answer.response, answer.body);
    }
    return (answer.body as DashboardApiAnswer<Result>).result as Result;
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

  /**
   * One read of a comparison, with the HTTP status. The Public API answers
   * a failed comparison with 502 and a body naming how long it keeps the
   * failure (`retry_after_seconds`); that is the comparison's answer, not a
   * gateway failure. A 502 whose `retry_after_seconds` is null, or that has
   * none, is thrown, so polling tries again up to three times: the Public
   * API sends null when nothing is stored, when the next request would
   * answer from a newer run, or when it cannot read the failure's lifetime.
   */
  async function readEconomyComparison(
    request: EconomyComparisonRequest,
    signal: AbortSignal | undefined,
  ): Promise<{ answer: DashboardApiAnswer; httpStatus: number }> {
    const answer = await send(
      "GET",
      economyComparisonPath(request),
      undefined,
      signal,
    );
    const fields = (answer.body ?? {}) as Record<string, unknown>;
    const isAnswer =
      answer.response.ok &&
      (fields.status === "ok" ||
        fields.status === "computing" ||
        fields.status === "error");
    const isStoredFailure =
      fields.status === "error" &&
      typeof fields.retry_after_seconds === "number";
    if (!isAnswer && !isStoredFailure) {
      throw refusal(answer.response, answer.body);
    }
    return {
      answer: answer.body as DashboardApiAnswer,
      httpStatus: answer.response.status,
    };
  }

  async function getEconomyComparison<Result = unknown>(
    request: EconomyComparisonRequest,
    options: RequestOptions = {},
  ): Promise<DashboardApiAnswer<Result>> {
    return (await readEconomyComparison(request, options.signal))
      .answer as DashboardApiAnswer<Result>;
  }

  async function compareEconomy<Result = unknown>(
    request: EconomyComparisonRequest,
    options: EconomyComparisonPollOptions = {},
  ): Promise<Result> {
    const intervalMilliseconds =
      options.intervalMilliseconds ?? DEFAULT_POLL_INTERVAL_MILLISECONDS;
    const deadline =
      Date.now() +
      (options.timeoutMilliseconds ?? DEFAULT_POLL_TIMEOUT_MILLISECONDS);
    let consecutiveRetries = 0;

    for (;;) {
      let answer: DashboardApiAnswer;
      let httpStatus: number;
      try {
        ({ answer, httpStatus } = await readEconomyComparison(
          request,
          options.signal,
        ));
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
        return answer.result as Result;
      }
      if (answer.status === "error") {
        throw new PolicyEngineApiError(
          messageFrom(answer, "The economy comparison failed."),
          httpStatus,
          answer,
          typeof answer.retry_after_seconds === "number"
            ? answer.retry_after_seconds
            : null,
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
    calculateHousehold: <Result = unknown>(
      request: HouseholdCalculationRequest,
      options: RequestOptions = {},
    ) =>
      okResult<Result>(
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

    getMetadata: <Result = unknown>(
      country: Country,
      options: RequestOptions = {},
    ) =>
      okResult<Result>(
        "GET",
        `/api/metadata/${encodeURIComponent(country)}`,
        undefined,
        options.signal,
      ),
  };
}
