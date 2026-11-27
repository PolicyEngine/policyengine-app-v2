import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { DEFAULT_BASE_URL, createPolicyEngineApiClient } from "../src/client";
import {
  EconomyComparisonTimeoutError,
  PolicyEngineApiError,
} from "../src/errors";
import type { EconomyComparisonPollOptions } from "../src/types";

const HOUSEHOLD = {
  people: { you: { age: { 2026: 40 } } },
  households: { your_household: { members: ["you"] } },
};
const CALCULATED_HOUSEHOLD = {
  ...HOUSEHOLD,
  people: { you: { age: { 2026: 40 }, net_income: { 2026: 50_000 } } },
};
const REFORM_PARAMETERS = {
  "gov.irs.credits.ctc.amount.base[0].amount": {
    "2026-01-01.2100-12-31": 3000,
  },
};
const STORED_POLICY_ID = 98765;
const CURRENT_LAW_POLICY_ID = 2;
const ECONOMY_RESULT = { budget: { budgetary_impact: -1_000_000_000 } };
const COMPARISON_REQUEST = {
  country: "us",
  policy: STORED_POLICY_ID,
  baseline: CURRENT_LAW_POLICY_ID,
  region: "state/ca",
  year: 2026,
} as const;
const UNAUTHENTICATED_USER_ID = "3f2c8b62-4a43-4d4f-9a5c-0d1b8ad8b7e1";

function jsonAnswer(
  body: unknown,
  statusCode = 200,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

const okAnswer = (result: unknown) =>
  jsonAnswer({ status: "ok", message: null, result });
/** Vercel's firewall refuses a request over a rate limit with this answer. */
const firewallRateLimitAnswer = () =>
  new Response("Too Many Requests", {
    status: 429,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "x-vercel-mitigated": "deny",
    },
  });
/** The firewall's rate limits count requests in fixed windows this long. */
const FIREWALL_WINDOW_MILLISECONDS = 60_000;
const computingAnswer = (queuePosition: number) =>
  jsonAnswer({
    status: "computing",
    message: null,
    result: null,
    queue_position: queuePosition,
  });

const fetchMock = vi.fn<typeof fetch>();

function sentRequest(callIndex = 0) {
  expect(fetchMock.mock.calls.length).toBeGreaterThan(callIndex);
  const [input, init] = fetchMock.mock.calls[callIndex];
  return {
    url: String(input),
    method: init?.method,
    headers: new Headers(init?.headers),
    credentials: init?.credentials,
    body: init?.body === undefined ? undefined : JSON.parse(String(init.body)),
  };
}

beforeEach(() => {
  fetchMock.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

/** Records when a promise settles, so a test can check it has not yet. */
function trackSettlement<Value>(promise: Promise<Value>) {
  const tracked = { settled: false, promise };
  tracked.promise = promise.finally(() => {
    tracked.settled = true;
  });
  return tracked;
}

describe("calculateHousehold", () => {
  test("given a household then it posts it to the dashboard API on www.policyengine.org and resolves with the result", async () => {
    // Given
    fetchMock.mockResolvedValue(okAnswer(CALCULATED_HOUSEHOLD));
    const client = createPolicyEngineApiClient({ fetch: fetchMock });

    // When
    const result = await client.calculateHousehold({
      country: "us",
      household: HOUSEHOLD,
      policy: REFORM_PARAMETERS,
    });

    // Then
    expect(result).toEqual(CALCULATED_HOUSEHOLD);
    expect(sentRequest()).toMatchObject({
      url: `${DEFAULT_BASE_URL}/api/household/calculate`,
      method: "POST",
      credentials: "omit",
      body: { country: "us", household: HOUSEHOLD, policy: REFORM_PARAMETERS },
    });
    expect(sentRequest().headers.get("content-type")).toBe("application/json");
  });

  test("given an unauthenticated user ID then every request carries it", async () => {
    // Given
    fetchMock.mockResolvedValue(okAnswer(CALCULATED_HOUSEHOLD));
    const client = createPolicyEngineApiClient({
      fetch: fetchMock,
      unauthenticatedUserId: UNAUTHENTICATED_USER_ID,
    });

    // When
    await client.calculateHousehold({ country: "us", household: HOUSEHOLD });

    // Then
    expect(sentRequest().headers.get("policyengine-unauthenticated-user")).toBe(
      UNAUTHENTICATED_USER_ID,
    );
  });

  test("given a base URL of the page's own origin then it calls relative paths", async () => {
    // Given
    fetchMock.mockResolvedValue(okAnswer(CALCULATED_HOUSEHOLD));
    const client = createPolicyEngineApiClient({
      fetch: fetchMock,
      baseUrl: "",
    });

    // When
    await client.calculateHousehold({ country: "uk", household: HOUSEHOLD });

    // Then
    expect(sentRequest().url).toBe("/api/household/calculate");
  });

  test("given the dashboard API refuses the household then it throws with the status and message", async () => {
    // Given
    fetchMock.mockResolvedValue(
      jsonAnswer(
        {
          status: "error",
          message: "household must be a JSON object.",
          result: null,
        },
        400,
      ),
    );
    const client = createPolicyEngineApiClient({ fetch: fetchMock });

    // When
    const failure = await client
      .calculateHousehold({ country: "us", household: HOUSEHOLD })
      .catch((error: unknown) => error);

    // Then
    expect(failure).toBeInstanceOf(PolicyEngineApiError);
    expect(failure).toMatchObject({
      status: 400,
      message: "household must be a JSON object.",
    });
  });

  test("given a rate-limited request then the error carries Retry-After", async () => {
    // Given
    fetchMock.mockResolvedValue(
      jsonAnswer({ status: "error", message: "Slow down", result: null }, 429, {
        "Retry-After": "30",
      }),
    );
    const client = createPolicyEngineApiClient({ fetch: fetchMock });

    // When
    const failure = await client
      .calculateHousehold({ country: "us", household: HOUSEHOLD })
      .catch((error: unknown) => error);

    // Then
    expect(failure).toMatchObject({ status: 429, retryAfterSeconds: 30 });
  });

  test.each([
    { description: "empty", retryAfter: "" },
    { description: "hexadecimal", retryAfter: "0x3c" },
  ])(
    "given a Retry-After that is $description then the error carries no Retry-After",
    async ({ retryAfter }) => {
      // Given
      fetchMock.mockResolvedValue(
        jsonAnswer(
          { status: "error", message: "Slow down", result: null },
          429,
          { "Retry-After": retryAfter },
        ),
      );
      const client = createPolicyEngineApiClient({ fetch: fetchMock });

      // When
      const failure = await client
        .calculateHousehold({ country: "us", household: HOUSEHOLD })
        .catch((error: unknown) => error);

      // Then
      expect(failure).toMatchObject({ status: 429, retryAfterSeconds: null });
    },
  );

  test("given the firewall's 429 then it throws it with no Retry-After, no body and the fallback message", async () => {
    // Given
    fetchMock.mockResolvedValue(firewallRateLimitAnswer());
    const client = createPolicyEngineApiClient({ fetch: fetchMock });

    // When
    const failure = await client
      .calculateHousehold({ country: "us", household: HOUSEHOLD })
      .catch((error: unknown) => error);

    // Then
    expect(failure).toBeInstanceOf(PolicyEngineApiError);
    expect(failure).toMatchObject({
      status: 429,
      retryAfterSeconds: null,
      body: null,
      message: "The dashboard API answered HTTP 429.",
    });
  });

  test("given the network fails then it throws a PolicyEngineApiError without a status", async () => {
    // Given
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    const client = createPolicyEngineApiClient({ fetch: fetchMock });

    // When
    const failure = await client
      .calculateHousehold({ country: "us", household: HOUSEHOLD })
      .catch((error: unknown) => error);

    // Then
    expect(failure).toBeInstanceOf(PolicyEngineApiError);
    expect(failure).toMatchObject({ status: null });
  });
});

describe("createPolicy", () => {
  test("given parameters then it posts them and resolves with the stored policy's ID", async () => {
    // Given
    fetchMock.mockResolvedValue(jsonAnswer({ id: STORED_POLICY_ID }, 201));
    const client = createPolicyEngineApiClient({ fetch: fetchMock });

    // When
    const policyId = await client.createPolicy({
      country: "us",
      parameters: REFORM_PARAMETERS,
    });

    // Then
    expect(policyId).toBe(STORED_POLICY_ID);
    expect(sentRequest()).toMatchObject({
      url: `${DEFAULT_BASE_URL}/api/policies`,
      method: "POST",
      body: { country: "us", parameters: REFORM_PARAMETERS },
    });
  });
});

describe("getEconomyComparison", () => {
  test("given a comparison then it reads it once with the comparison's query", async () => {
    // Given
    fetchMock.mockResolvedValue(computingAnswer(3));
    const client = createPolicyEngineApiClient({ fetch: fetchMock });

    // When
    const answer = await client.getEconomyComparison(COMPARISON_REQUEST);

    // Then
    expect(answer.status).toBe("computing");
    expect(sentRequest()).toMatchObject({
      url: `${DEFAULT_BASE_URL}/api/economy/compare?country=us&policy=98765&baseline=2&region=state%2Fca&year=2026`,
      method: "GET",
    });
  });
});

describe("compareEconomy", () => {
  test("given a comparison that computes for two reads then it polls until it resolves with the result", async () => {
    // Given
    fetchMock
      .mockResolvedValueOnce(computingAnswer(2))
      .mockResolvedValueOnce(computingAnswer(1))
      .mockResolvedValueOnce(okAnswer(ECONOMY_RESULT));
    const onProgress = vi.fn();
    const client = createPolicyEngineApiClient({ fetch: fetchMock });

    // When
    const result = await client.compareEconomy(COMPARISON_REQUEST, {
      intervalMilliseconds: 1,
      onProgress,
    });

    // Then
    expect(result).toEqual(ECONOMY_RESULT);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(onProgress).toHaveBeenCalledTimes(2);
  });

  test("given a comparison that fails then it throws the comparison's message", async () => {
    // Given
    fetchMock.mockResolvedValue(
      jsonAnswer({
        status: "error",
        message: "Simulation failed",
        result: null,
      }),
    );
    const client = createPolicyEngineApiClient({ fetch: fetchMock });

    // When
    const failure = await client
      .compareEconomy(COMPARISON_REQUEST, { intervalMilliseconds: 1 })
      .catch((error: unknown) => error);

    // Then
    expect(failure).toBeInstanceOf(PolicyEngineApiError);
    expect((failure as Error).message).toBe("Simulation failed");
  });

  test("given a rate-limited read then it waits and keeps polling", async () => {
    // Given
    fetchMock
      .mockResolvedValueOnce(
        jsonAnswer(
          { status: "error", message: "Slow down", result: null },
          429,
          {
            "Retry-After": "0",
          },
        ),
      )
      .mockResolvedValueOnce(okAnswer(ECONOMY_RESULT));
    const client = createPolicyEngineApiClient({ fetch: fetchMock });

    // When
    const result = await client.compareEconomy(COMPARISON_REQUEST, {
      intervalMilliseconds: 1,
    });

    // Then
    expect(result).toEqual(ECONOMY_RESULT);
  });

  test("given four gateway failures in a row then it stops polling and throws", async () => {
    // Given
    fetchMock.mockImplementation(async () =>
      jsonAnswer(
        { status: "error", message: "Bad gateway", result: null },
        502,
      ),
    );
    const client = createPolicyEngineApiClient({ fetch: fetchMock });

    // When
    const failure = await client
      .compareEconomy(COMPARISON_REQUEST, { intervalMilliseconds: 1 })
      .catch((error: unknown) => error);

    // Then
    expect(failure).toMatchObject({ status: 502 });
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  test("given a gateway failure with less than an interval left then it reads once more at the deadline", async () => {
    // Given
    vi.useFakeTimers();
    const timeoutMilliseconds = 3_000;
    fetchMock
      .mockResolvedValueOnce(
        jsonAnswer(
          { status: "error", message: "Bad gateway", result: null },
          502,
        ),
      )
      .mockResolvedValueOnce(okAnswer(ECONOMY_RESULT));
    const client = createPolicyEngineApiClient({ fetch: fetchMock });

    // When
    const polling = trackSettlement(
      client
        .compareEconomy(COMPARISON_REQUEST, {
          intervalMilliseconds: 5_000,
          timeoutMilliseconds,
        })
        .catch((error: unknown) => error),
    );
    await vi.advanceTimersByTimeAsync(timeoutMilliseconds - 1);
    const settledBeforeTheDeadline = polling.settled;
    await vi.advanceTimersByTimeAsync(1);
    const outcome = await polling.promise;

    // Then
    expect(settledBeforeTheDeadline).toBe(false);
    expect(outcome).toEqual(ECONOMY_RESULT);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  describe("given the firewall's rate limit", () => {
    test("given a rate-limited read without Retry-After then it waits the firewall's 60-second window before reading again", async () => {
      // Given
      vi.useFakeTimers();
      fetchMock
        .mockResolvedValueOnce(firewallRateLimitAnswer())
        .mockResolvedValueOnce(okAnswer(ECONOMY_RESULT));
      const client = createPolicyEngineApiClient({ fetch: fetchMock });

      // When
      const polling = client
        .compareEconomy(COMPARISON_REQUEST)
        .catch((error: unknown) => error);
      await vi.advanceTimersByTimeAsync(FIREWALL_WINDOW_MILLISECONDS - 1);
      const readsBeforeTheWindowEnds = fetchMock.mock.calls.length;
      await vi.advanceTimersByTimeAsync(1);
      const outcome = await polling;

      // Then
      expect(readsBeforeTheWindowEnds).toBe(1);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(outcome).toEqual(ECONOMY_RESULT);
    });

    test("given more than three rate-limited reads in a row then it keeps polling until the comparison is ready", async () => {
      // Given
      vi.useFakeTimers();
      for (let refusal = 0; refusal < 5; refusal += 1) {
        fetchMock.mockResolvedValueOnce(firewallRateLimitAnswer());
      }
      fetchMock.mockResolvedValueOnce(okAnswer(ECONOMY_RESULT));
      const client = createPolicyEngineApiClient({ fetch: fetchMock });

      // When
      const polling = client
        .compareEconomy(COMPARISON_REQUEST)
        .catch((error: unknown) => error);
      await vi.advanceTimersByTimeAsync(FIREWALL_WINDOW_MILLISECONDS * 5);
      const outcome = await polling;

      // Then
      expect(outcome).toEqual(ECONOMY_RESULT);
      expect(fetchMock).toHaveBeenCalledTimes(6);
    });

    test("given rate-limited reads between gateway failures then the fourth gateway failure since the last answer still ends polling", async () => {
      // Given
      vi.useFakeTimers();
      const gatewayFailure = () =>
        jsonAnswer(
          { status: "error", message: "Bad gateway", result: null },
          502,
        );
      fetchMock
        .mockResolvedValueOnce(gatewayFailure())
        .mockResolvedValueOnce(firewallRateLimitAnswer())
        .mockResolvedValueOnce(gatewayFailure())
        .mockResolvedValueOnce(firewallRateLimitAnswer())
        .mockResolvedValueOnce(gatewayFailure())
        .mockResolvedValueOnce(gatewayFailure())
        .mockResolvedValue(okAnswer(ECONOMY_RESULT));
      const client = createPolicyEngineApiClient({ fetch: fetchMock });

      // When
      const polling = client
        .compareEconomy(COMPARISON_REQUEST)
        .catch((error: unknown) => error);
      await vi.advanceTimersByTimeAsync(FIREWALL_WINDOW_MILLISECONDS * 3);
      const failure = await polling;

      // Then
      expect(failure).toMatchObject({ status: 502 });
      expect(fetchMock).toHaveBeenCalledTimes(6);
    });

    test("given a rate-limited read with less than a window left then a read at the deadline can still resolve the comparison", async () => {
      // Given
      vi.useFakeTimers();
      const timeoutMilliseconds = FIREWALL_WINDOW_MILLISECONDS * 0.75;
      fetchMock
        .mockResolvedValueOnce(firewallRateLimitAnswer())
        .mockResolvedValueOnce(okAnswer(ECONOMY_RESULT));
      const client = createPolicyEngineApiClient({ fetch: fetchMock });

      // When
      const polling = trackSettlement(
        client
          .compareEconomy(COMPARISON_REQUEST, { timeoutMilliseconds })
          .catch((error: unknown) => error),
      );
      await vi.advanceTimersByTimeAsync(timeoutMilliseconds - 1);
      const settledBeforeTheDeadline = polling.settled;
      await vi.advanceTimersByTimeAsync(1);
      const outcome = await polling.promise;

      // Then
      expect(settledBeforeTheDeadline).toBe(false);
      expect(outcome).toEqual(ECONOMY_RESULT);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    test("given rate-limited reads until the deadline then it reads once more at the deadline and throws a timeout error", async () => {
      // Given
      vi.useFakeTimers();
      const timeoutMilliseconds = FIREWALL_WINDOW_MILLISECONDS * 1.5;
      fetchMock.mockImplementation(async () => firewallRateLimitAnswer());
      const client = createPolicyEngineApiClient({ fetch: fetchMock });

      // When
      const polling = trackSettlement(
        client
          .compareEconomy(COMPARISON_REQUEST, { timeoutMilliseconds })
          .catch((error: unknown) => error),
      );
      await vi.advanceTimersByTimeAsync(timeoutMilliseconds - 1);
      const settledBeforeTheDeadline = polling.settled;
      await vi.advanceTimersByTimeAsync(1);
      const failure = await polling.promise;

      // Then
      expect(settledBeforeTheDeadline).toBe(false);
      expect(failure).toBeInstanceOf(EconomyComparisonTimeoutError);
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
  });

  test("given a rate-limited read with Retry-After 0 then it still waits one interval before reading again", async () => {
    // Given
    vi.useFakeTimers();
    const intervalMilliseconds = 5_000;
    fetchMock
      .mockResolvedValueOnce(
        jsonAnswer(
          { status: "error", message: "Slow down", result: null },
          429,
          { "Retry-After": "0" },
        ),
      )
      .mockResolvedValueOnce(okAnswer(ECONOMY_RESULT));
    const client = createPolicyEngineApiClient({ fetch: fetchMock });

    // When
    const polling = client
      .compareEconomy(COMPARISON_REQUEST, { intervalMilliseconds })
      .catch((error: unknown) => error);
    await vi.advanceTimersByTimeAsync(intervalMilliseconds - 1);
    const readsBeforeTheInterval = fetchMock.mock.calls.length;
    await vi.advanceTimersByTimeAsync(1);
    const outcome = await polling;

    // Then
    expect(readsBeforeTheInterval).toBe(1);
    expect(outcome).toEqual(ECONOMY_RESULT);
  });

  test("given a rate-limited read with Retry-After 0 and an interval of 0 then it still waits a second before reading again", async () => {
    // Given
    vi.useFakeTimers();
    fetchMock
      .mockResolvedValueOnce(
        jsonAnswer(
          { status: "error", message: "Slow down", result: null },
          429,
          { "Retry-After": "0" },
        ),
      )
      .mockResolvedValueOnce(okAnswer(ECONOMY_RESULT));
    const client = createPolicyEngineApiClient({ fetch: fetchMock });

    // When
    const polling = client
      .compareEconomy(COMPARISON_REQUEST, { intervalMilliseconds: 0 })
      .catch((error: unknown) => error);
    await vi.advanceTimersByTimeAsync(999);
    const readsBeforeASecond = fetchMock.mock.calls.length;
    await vi.advanceTimersByTimeAsync(1);
    const outcome = await polling;

    // Then
    expect(readsBeforeASecond).toBe(1);
    expect(outcome).toEqual(ECONOMY_RESULT);
  });

  test("given a comparison that finishes between the last full interval and the deadline then the read at the deadline resolves it", async () => {
    // Given
    vi.useFakeTimers();
    fetchMock
      .mockResolvedValueOnce(computingAnswer(3))
      .mockResolvedValueOnce(computingAnswer(2))
      .mockResolvedValueOnce(computingAnswer(1))
      .mockResolvedValueOnce(okAnswer(ECONOMY_RESULT));
    const client = createPolicyEngineApiClient({ fetch: fetchMock });

    // When
    const polling = trackSettlement(
      client
        .compareEconomy(COMPARISON_REQUEST, {
          intervalMilliseconds: 5_000,
          timeoutMilliseconds: 12_000,
        })
        .catch((error: unknown) => error),
    );
    await vi.advanceTimersByTimeAsync(12_000 - 1);
    const settledBeforeTheDeadline = polling.settled;
    await vi.advanceTimersByTimeAsync(1);
    const outcome = await polling.promise;

    // Then
    expect(settledBeforeTheDeadline).toBe(false);
    expect(outcome).toEqual(ECONOMY_RESULT);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  describe("given poll options that would make it read without waiting", () => {
    /** Polls for a moment with real timers, then stops it. */
    async function pollBriefly(pollOptions: EconomyComparisonPollOptions) {
      const abortController = new AbortController();
      const client = createPolicyEngineApiClient({ fetch: fetchMock });
      const polling = client
        .compareEconomy(COMPARISON_REQUEST, {
          ...pollOptions,
          signal: abortController.signal,
        })
        .catch((error: unknown) => error);
      await new Promise((resolve) => setTimeout(resolve, 50));
      abortController.abort(new DOMException("Test over", "AbortError"));
      return polling;
    }

    test.each([Number.NaN, -1, Number.POSITIVE_INFINITY])(
      "given an interval of %s then it rejects with a RangeError without reading",
      async (intervalMilliseconds) => {
        // Given
        fetchMock.mockImplementation(async () => computingAnswer(1));

        // When
        const outcome = await pollBriefly({ intervalMilliseconds });

        // Then
        expect(outcome).toBeInstanceOf(RangeError);
        expect(fetchMock).not.toHaveBeenCalled();
      },
    );

    test.each([Number.NaN, -1])(
      "given a timeout of %s then it rejects with a RangeError without reading",
      async (timeoutMilliseconds) => {
        // Given
        fetchMock.mockImplementation(async () => computingAnswer(1));

        // When
        const outcome = await pollBriefly({ timeoutMilliseconds });

        // Then
        expect(outcome).toBeInstanceOf(RangeError);
        expect(fetchMock).not.toHaveBeenCalled();
      },
    );

    test.each([
      { description: 'the string "60000"', timeoutValue: "60000" },
      { description: "an object", timeoutValue: {} },
    ])(
      "given a timeout that is $description then it rejects with a RangeError without reading",
      async ({ timeoutValue }) => {
        // Given
        fetchMock.mockImplementation(async () => computingAnswer(1));

        // When
        const outcome = await pollBriefly({
          timeoutMilliseconds: timeoutValue as unknown as number,
        });

        // Then
        expect(outcome).toBeInstanceOf(RangeError);
        expect(fetchMock).not.toHaveBeenCalled();
      },
    );

    test("given a Retry-After longer than the longest timer and no timeout then it waits instead of reading again at once", async () => {
      // Given
      fetchMock
        .mockResolvedValueOnce(
          jsonAnswer(
            { status: "error", message: "Slow down", result: null },
            429,
            { "Retry-After": "3000000" },
          ),
        )
        .mockResolvedValue(okAnswer(ECONOMY_RESULT));

      // When
      const outcome = await pollBriefly({
        timeoutMilliseconds: Number.POSITIVE_INFINITY,
      });

      // Then
      expect((outcome as DOMException).name).toBe("AbortError");
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  test("given the firewall's 429 on another origin, which fetch reports as a network failure, then it stops at once with no status", async () => {
    // Given
    fetchMock
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValue(okAnswer(ECONOMY_RESULT));
    const client = createPolicyEngineApiClient({ fetch: fetchMock });

    // When
    const failure = await client
      .compareEconomy(COMPARISON_REQUEST, { intervalMilliseconds: 1 })
      .catch((error: unknown) => error);

    // Then
    expect(failure).toBeInstanceOf(PolicyEngineApiError);
    expect(failure).toMatchObject({ status: null });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("given a comparison still computing at the deadline then it throws a timeout error", async () => {
    // Given
    fetchMock.mockImplementation(async () => computingAnswer(1));
    const client = createPolicyEngineApiClient({ fetch: fetchMock });

    // When
    const failure = await client
      .compareEconomy(COMPARISON_REQUEST, {
        intervalMilliseconds: 5,
        timeoutMilliseconds: 12,
      })
      .catch((error: unknown) => error);

    // Then
    expect(failure).toBeInstanceOf(EconomyComparisonTimeoutError);
  });

  test("given the caller aborts while it waits then it stops polling", async () => {
    // Given
    fetchMock.mockImplementation(async () => computingAnswer(1));
    const client = createPolicyEngineApiClient({ fetch: fetchMock });
    const abortController = new AbortController();

    // When
    const polling = client
      .compareEconomy(COMPARISON_REQUEST, {
        intervalMilliseconds: 60_000,
        signal: abortController.signal,
      })
      .catch((error: unknown) => error);
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    abortController.abort(new DOMException("Left the page", "AbortError"));
    const failure = await polling;

    // Then
    expect((failure as DOMException).name).toBe("AbortError");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("getMetadata", () => {
  test("given a country then it reads the country's metadata", async () => {
    // Given
    const metadata = { variables: {}, parameters: {} };
    fetchMock.mockResolvedValue(okAnswer(metadata));
    const client = createPolicyEngineApiClient({ fetch: fetchMock });

    // When
    const result = await client.getMetadata("uk");

    // Then
    expect(result).toEqual(metadata);
    expect(sentRequest()).toMatchObject({
      url: `${DEFAULT_BASE_URL}/api/metadata/uk`,
      method: "GET",
    });
  });
});

describe("compareEconomy failures from the Public API", () => {
  const STORED_FAILURE = {
    status: "error",
    message: "The simulation failed: dataset unavailable",
    result: null,
    retry_after_seconds: 3600,
    delete_after_seconds: 0,
  };
  const SIMULATION_SERVICE_UNREACHABLE = {
    status: "error",
    message: "The simulation service did not respond",
    result: null,
    retry_after_seconds: null,
    delete_after_seconds: null,
  };

  test("given a stored failed comparison answered with 502 then getEconomyComparison resolves with the error answer", async () => {
    // Given
    fetchMock.mockResolvedValue(jsonAnswer(STORED_FAILURE, 502));
    const client = createPolicyEngineApiClient({ fetch: fetchMock });

    // When
    const answer = await client
      .getEconomyComparison(COMPARISON_REQUEST)
      .catch((error: unknown) => error);

    // Then
    expect(answer).toEqual(STORED_FAILURE);
  });

  test("given a stored failed comparison then compareEconomy throws its message once, without polling again", async () => {
    // Given
    fetchMock.mockResolvedValue(jsonAnswer(STORED_FAILURE, 502));
    const client = createPolicyEngineApiClient({ fetch: fetchMock });

    // When
    const failure = await client
      .compareEconomy(COMPARISON_REQUEST, { intervalMilliseconds: 1 })
      .catch((error: unknown) => error);

    // Then
    expect(failure).toBeInstanceOf(PolicyEngineApiError);
    expect(failure).toMatchObject({
      status: 502,
      message: STORED_FAILURE.message,
      body: STORED_FAILURE,
      retryAfterSeconds: STORED_FAILURE.retry_after_seconds,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("given a stored failure whose lifetime has run out then compareEconomy still throws it once rather than starting a new run", async () => {
    // Given
    fetchMock.mockResolvedValue(
      jsonAnswer({ ...STORED_FAILURE, retry_after_seconds: 0 }, 502),
    );
    const client = createPolicyEngineApiClient({ fetch: fetchMock });

    // When
    const failure = await client
      .compareEconomy(COMPARISON_REQUEST, { intervalMilliseconds: 1 })
      .catch((error: unknown) => error);

    // Then
    expect(failure).toMatchObject({ status: 502, retryAfterSeconds: 0 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("given a gateway's own 502, which the dashboard API turns into JSON with no retry_after_seconds, then compareEconomy polls again", async () => {
    // Given
    fetchMock
      .mockResolvedValueOnce(
        jsonAnswer(
          {
            status: "error",
            message: "The Public API answered HTTP 502.",
            result: null,
          },
          502,
        ),
      )
      .mockResolvedValueOnce(okAnswer(ECONOMY_RESULT));
    const client = createPolicyEngineApiClient({ fetch: fetchMock });

    // When
    const result = await client.compareEconomy(COMPARISON_REQUEST, {
      intervalMilliseconds: 1,
    });

    // Then
    expect(result).toEqual(ECONOMY_RESULT);
  });

  test("given the caller aborts before any answer arrives then compareEconomy rejects with the abort without retrying", async () => {
    // Given
    const abortController = new AbortController();
    abortController.abort(new DOMException("Left the page", "AbortError"));
    fetchMock.mockImplementation(async (_input, init) => {
      throw init?.signal?.reason;
    });
    const client = createPolicyEngineApiClient({ fetch: fetchMock });

    // When
    const failure = await client
      .compareEconomy(COMPARISON_REQUEST, {
        intervalMilliseconds: 1,
        signal: abortController.signal,
      })
      .catch((error: unknown) => error);

    // Then
    expect((failure as DOMException).name).toBe("AbortError");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("given the simulation service did not respond, so nothing is stored, then compareEconomy polls again", async () => {
    // Given
    fetchMock
      .mockResolvedValueOnce(jsonAnswer(SIMULATION_SERVICE_UNREACHABLE, 502))
      .mockResolvedValueOnce(okAnswer(ECONOMY_RESULT));
    const client = createPolicyEngineApiClient({ fetch: fetchMock });

    // When
    const result = await client.compareEconomy(COMPARISON_REQUEST, {
      intervalMilliseconds: 1,
    });

    // Then
    expect(result).toEqual(ECONOMY_RESULT);
  });
});

describe("request failures", () => {
  test("given the caller aborts while the answer is still arriving then it rejects with the abort", async () => {
    // Given
    const abortController = new AbortController();
    fetchMock.mockImplementation(
      async () =>
        new Response(
          new ReadableStream({
            start(streamController) {
              streamController.enqueue(new TextEncoder().encode('{"status"'));
              abortController.signal.addEventListener("abort", () =>
                streamController.error(abortController.signal.reason),
              );
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
    );
    const client = createPolicyEngineApiClient({ fetch: fetchMock });

    // When
    const loading = client
      .getMetadata("us", { signal: abortController.signal })
      .catch((error: unknown) => error);
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    abortController.abort(new DOMException("Changed country", "AbortError"));
    const failure = await loading;

    // Then
    expect(failure).not.toBeInstanceOf(PolicyEngineApiError);
    expect((failure as DOMException).name).toBe("AbortError");
  });

  test("given the connection drops while the answer is arriving then it throws without claiming an answer arrived", async () => {
    // Given
    fetchMock.mockImplementation(
      async () =>
        new Response(
          new ReadableStream({
            start(streamController) {
              streamController.enqueue(new TextEncoder().encode('{"status"'));
              streamController.error(new TypeError("terminated"));
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
    );
    const client = createPolicyEngineApiClient({ fetch: fetchMock });

    // When
    const failure = await client
      .getMetadata("us")
      .catch((error: unknown) => error);

    // Then
    expect(failure).toBeInstanceOf(PolicyEngineApiError);
    expect(failure).toMatchObject({ status: null });
  });

  test.each([
    [
      "createPolicy",
      (client: ReturnType<typeof createPolicyEngineApiClient>) =>
        client.createPolicy({ country: "us", parameters: REFORM_PARAMETERS }),
      400,
    ],
    [
      "getMetadata",
      (client: ReturnType<typeof createPolicyEngineApiClient>) =>
        client.getMetadata("uk"),
      503,
    ],
  ])(
    "given the dashboard API refuses %s then it throws with the status",
    async (_methodName, callClient, statusCode) => {
      // Given
      fetchMock.mockResolvedValue(
        jsonAnswer(
          { status: "error", message: "Refused", result: null },
          statusCode,
        ),
      );
      const client = createPolicyEngineApiClient({ fetch: fetchMock });

      // When
      const failure = await callClient(client).catch((error: unknown) => error);

      // Then
      expect(failure).toBeInstanceOf(PolicyEngineApiError);
      expect(failure).toMatchObject({ status: statusCode, message: "Refused" });
    },
  );
});
