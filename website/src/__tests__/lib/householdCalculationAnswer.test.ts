// @vitest-environment node
import {
  HouseholdCalculationFailedError,
  HouseholdCalculationRefusedError,
  HouseholdCalculationTimeoutError,
  PublicApiUnavailableError,
  ROUTE_ERROR_HEADER,
  type CalculatedHousehold,
  type HouseholdCalculator,
  type InlineHouseholdCalculationRequest,
} from "@policyengine/public-api-forwarding";
import { describe, expect, test, vi } from "vitest";

import { householdCalculationAnswer } from "@/lib/dashboardApi/householdCalculationAnswer";

const SITE_URL = "https://www.policyengine.org";
const DASHBOARD_ORIGIN = "https://keep-your-pay-act.vercel.app";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": DASHBOARD_ORIGIN,
  Vary: "Origin",
};
const CALCULATION_ID = "8a1f6b0e-3c2d-4e5f-9a7b-1c2d3e4f5a6b";
// Vercel's limit on a function answer that isn't streamed.
const VERCEL_BUFFERED_ANSWER_LIMIT_BYTES = 4.5 * 1024 * 1024;

const SITUATION = {
  people: { you: { age: { 2026: 40 }, employment_income: { 2026: 50_000 } } },
  households: {
    your_household: { members: ["you"], household_net_income: { 2026: null } },
  },
};
const CALCULATED_SITUATION = {
  people: { you: { age: { 2026: 40 }, employment_income: { 2026: 50_000 } } },
  households: {
    your_household: {
      members: ["you"],
      household_net_income: { 2026: 44_210.5 },
    },
  },
};
const US_REQUEST: InlineHouseholdCalculationRequest = {
  country: "us",
  household: SITUATION,
};
const INVALID_INPUT_ERROR = {
  type: "unknown_variable",
  name: "employment_incme",
  path: "people.you.employment_incme",
  message: "employment_incme is not a variable of the US model.",
};
const SPM_ERROR = {
  code: "SPM_SETTINGS_INVALID",
  message: "spm.geography_kind must be national or state.",
};

function calculatedHousehold(
  overrides: Partial<CalculatedHousehold> = {},
): CalculatedHousehold {
  return {
    calculationId: CALCULATION_ID,
    household: CALCULATED_SITUATION,
    warnings: [],
    spmConfig: null,
    spmProvenance: null,
    countryPackageVersion: "1.500.0",
    policyengineVersion: "3.4.0",
    ...overrides,
  };
}

/**
 * A calculator that resolves with `outcome`, or rejects with it when it is
 * an error, and records what it was asked.
 */
function calculatorFinishingWith(outcome: CalculatedHousehold | Error) {
  const calculateHousehold = vi.fn<HouseholdCalculator["calculateHousehold"]>(
    async () => {
      if (outcome instanceof Error) {
        throw outcome;
      }
      return outcome;
    },
  );
  const calculator: HouseholdCalculator = { calculateHousehold };
  return { calculator, calculateHousehold };
}

function browserRequest(signal?: AbortSignal): Request {
  return new Request(`${SITE_URL}/api/household/calculate`, {
    method: "POST",
    headers: { origin: DASHBOARD_ORIGIN },
    signal,
  });
}

function fakeLogger() {
  return { error: vi.fn(), warn: vi.fn() };
}

async function answerFor(
  outcome: CalculatedHousehold | Error,
  incomingRequest = browserRequest(),
) {
  const { calculator, calculateHousehold } = calculatorFinishingWith(outcome);
  const logger = fakeLogger();
  const response = await householdCalculationAnswer(calculator, US_REQUEST, {
    incomingRequest,
    responseHeaders: CORS_HEADERS,
    logger,
  });
  return { response, calculateHousehold, logger };
}

function refusedWith(
  statusCode: number,
  message: string,
  retryAfterSeconds: number | null = null,
): HouseholdCalculationRefusedError {
  return new HouseholdCalculationRefusedError(message, {
    statusCode,
    body: { status: "error", message },
    code: null,
    retryAfterSeconds,
    observabilityId: null,
    requestId: null,
    calculationId: null,
  });
}

async function readInParts(response: Response): Promise<Uint8Array[]> {
  const parts: Uint8Array[] = [];
  const reader = (response.body as ReadableStream<Uint8Array>).getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      return parts;
    }
    parts.push(value);
  }
}

describe("householdCalculationAnswer", () => {
  test("given a calculated household then it answers 200 with /calculate's envelope, its warnings and SPM provenance", async () => {
    // Given
    const calculated = calculatedHousehold({
      warnings: ["Ignored input: rent"],
      spmConfig: { geography_kind: "national" },
      spmProvenance: { forecast_content_sha256: "ab12" },
    });

    // When
    const { response } = await answerFor(calculated);

    // Then
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "ok",
      message: null,
      result: CALCULATED_SITUATION,
      warnings: ["Ignored input: rent"],
      spm_provenance: { forecast_content_sha256: "ab12" },
    });
    expect(response.headers.get("content-type")).toBe("application/json");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("access-control-allow-origin")).toBe(
      DASHBOARD_ORIGIN,
    );
    expect(response.headers.get(ROUTE_ERROR_HEADER)).toBeNull();
  });

  test("given no warnings and no SPM provenance then the answer leaves both out, as /calculate's did", async () => {
    // When
    const { response } = await answerFor(calculatedHousehold());

    // Then
    expect(await response.json()).toEqual({
      status: "ok",
      message: null,
      result: CALCULATED_SITUATION,
    });
  });

  test("given a result larger than Vercel's limit on buffered answers then it streams the answer in parts that join into the whole envelope", async () => {
    // Given
    const pointCount = 1_000_000;
    const largeHousehold = {
      ...CALCULATED_SITUATION,
      households: {
        your_household: {
          members: ["you"],
          household_net_income: {
            2026: Array.from({ length: pointCount }, (_, point) => point),
          },
        },
      },
    };

    // When
    const { response } = await answerFor(
      calculatedHousehold({ household: largeHousehold }),
    );
    const parts = await readInParts(response);

    // Then
    const totalBytes = parts.reduce((sum, part) => sum + part.byteLength, 0);
    expect(totalBytes).toBeGreaterThan(VERCEL_BUFFERED_ANSWER_LIMIT_BYTES);
    expect(parts.length).toBeGreaterThan(1);
    for (const part of parts) {
      expect(part.byteLength).toBeLessThan(VERCEL_BUFFERED_ANSWER_LIMIT_BYTES);
    }
    const text = new TextDecoder().decode(
      Buffer.concat(parts.map((part) => Buffer.from(part))),
    );
    expect(JSON.parse(text)).toEqual({
      status: "ok",
      message: null,
      result: largeHousehold,
    });
  });

  test("given the browser's request then the calculation stops when the browser goes away", async () => {
    // Given
    const incomingRequest = browserRequest(new AbortController().signal);

    // When
    const { calculateHousehold } = await answerFor(
      calculatedHousehold(),
      incomingRequest,
    );

    // Then
    expect(calculateHousehold).toHaveBeenCalledWith(US_REQUEST, {
      signal: incomingRequest.signal,
    });
  });

  test("given a calculation that fails on inputs the model doesn't recognise then it answers 400 with each input in errors, as /calculate did", async () => {
    // Given
    const message =
      "Unrecognized calculate input(s): employment_incme is not a variable of the US model.";
    const failure = new HouseholdCalculationFailedError(
      message,
      CALCULATION_ID,
      "invalid_inputs",
      [INVALID_INPUT_ERROR],
      null,
    );

    // When
    const { response } = await answerFor(failure);

    // Then
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      status: "error",
      message,
      result: null,
      errors: [INVALID_INPUT_ERROR],
    });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("access-control-allow-origin")).toBe(
      DASHBOARD_ORIGIN,
    );
    expect(response.headers.get(ROUTE_ERROR_HEADER)).toBeNull();
  });

  test("given a calculation that fails on its SPM settings then it answers 400 with the SPM error in errors, as /calculate did", async () => {
    // Given
    const failure = new HouseholdCalculationFailedError(
      SPM_ERROR.message,
      CALCULATION_ID,
      "invalid_spm_selection",
      [],
      SPM_ERROR,
    );

    // When
    const { response } = await answerFor(failure);

    // Then
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      status: "error",
      message: SPM_ERROR.message,
      result: null,
      errors: [SPM_ERROR],
    });
  });

  test("given a calculation that fails on a household the model can't read then it answers 400 with the model's message", async () => {
    // Given
    const message = "Invalid household payload: people must be an object.";
    const failure = new HouseholdCalculationFailedError(
      message,
      CALCULATION_ID,
      "invalid_household",
      [],
      null,
    );

    // When
    const { response } = await answerFor(failure);

    // Then
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      status: "error",
      message,
      result: null,
    });
  });

  test.each([
    ["no code, because the household function raised", null],
    ["calculation_failed", "calculation_failed"],
    ["bundle_mismatch", "bundle_mismatch"],
  ])(
    "given a calculation that fails with %s then it answers 500 as /calculate did, and logs the calculation",
    async (_label, code) => {
      // Given
      const failure = new HouseholdCalculationFailedError(
        "household_function_error: division by zero",
        CALCULATION_ID,
        code,
        [],
        null,
      );

      // When
      const { response, logger } = await answerFor(failure);

      // Then
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({
        status: "error",
        message:
          "Error calculating household under policy: household_function_error: division by zero",
        result: null,
      });
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining(CALCULATION_ID),
      );
    },
  );

  test("given API v1 refuses the household as invalid (422) then it answers 400 with API v1's message, as /calculate did", async () => {
    // Given
    const message = "household.people must have at least one person";

    // When
    const { response } = await answerFor(refusedWith(422, message));

    // Then
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      status: "error",
      message,
      result: null,
    });
    expect(response.headers.get(ROUTE_ERROR_HEADER)).toBeNull();
  });

  test.each([400, 401, 403, 404, 413, 500, 502, 503])(
    "given API v1 answers %i then that status and API v1's message reach the caller",
    async (statusCode) => {
      // Given
      const message = `API v1's message for HTTP ${statusCode}`;

      // When
      const { response } = await answerFor(refusedWith(statusCode, message));

      // Then
      expect(response.status).toBe(statusCode);
      expect(await response.json()).toEqual({
        status: "error",
        message,
        result: null,
      });
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(response.headers.get(ROUTE_ERROR_HEADER)).toBeNull();
    },
  );

  test("given API v1 limits the rate of requests then the caller gets 429 with its Retry-After", async () => {
    // When
    const { response } = await answerFor(
      refusedWith(429, "Too many requests", 30),
    );

    // Then
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("30");
    expect((await response.json()).message).toBe("Too many requests");
  });

  test("given API v1 accepted a request but its answer can't be read then it answers 502 as the route's own error", async () => {
    // Given
    const message =
      "API v1 accepted the household calculation, but its answer has no calculation ID the helper can read, so the calculation, if one started, cannot be read.";

    // When
    const { response, logger } = await answerFor(refusedWith(202, message));

    // Then
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      status: "error",
      message,
      result: null,
    });
    expect(response.headers.get(ROUTE_ERROR_HEADER)).toBe("true");
    expect(logger.error).toHaveBeenCalled();
  });

  test("given the calculation doesn't finish within the helper's time limit then it answers 504 and logs the calculation", async () => {
    // Given
    const timeout = new HouseholdCalculationTimeoutError(
      `Household calculation ${CALCULATION_ID} did not finish in time.`,
      CALCULATION_ID,
      "running",
    );

    // When
    const { response, logger } = await answerFor(timeout);

    // Then
    expect(response.status).toBe(504);
    expect(await response.json()).toEqual({
      status: "error",
      message: "The household calculation did not finish in time.",
      result: null,
    });
    expect(response.headers.get(ROUTE_ERROR_HEADER)).toBe("true");
    expect(response.headers.get("access-control-allow-origin")).toBe(
      DASHBOARD_ORIGIN,
    );
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining(CALCULATION_ID),
    );
  });

  test("given API v1 can't be called then it answers with the forwarder's status and message", async () => {
    // Given
    const unavailable = new PublicApiUnavailableError(
      "The Public API could not be reached.",
      502,
      "unreachable",
    );

    // When
    const { response } = await answerFor(unavailable);

    // Then
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      status: "error",
      message: "The Public API could not be reached.",
      result: null,
    });
    expect(response.headers.get(ROUTE_ERROR_HEADER)).toBe("true");
  });

  test("given the browser has gone away then it answers 502 without logging an error", async () => {
    // Given
    const browserConnection = new AbortController();
    browserConnection.abort();

    // When
    const { response, logger } = await answerFor(
      browserConnection.signal.reason as Error,
      browserRequest(browserConnection.signal),
    );

    // Then
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      status: "error",
      message: "The browser closed the request.",
      result: null,
    });
    expect(logger.error).not.toHaveBeenCalled();
  });

  test("given anything else goes wrong then it answers 500 as the route's own error and logs it", async () => {
    // When
    const { response, logger } = await answerFor(new TypeError("boom"));

    // Then
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      status: "error",
      message: "The household could not be calculated.",
      result: null,
    });
    expect(response.headers.get(ROUTE_ERROR_HEADER)).toBe("true");
    expect(logger.error).toHaveBeenCalled();
  });
});
