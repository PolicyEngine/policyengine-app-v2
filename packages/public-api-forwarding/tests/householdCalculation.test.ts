import { describe, expect, test, vi } from "vitest";

import {
  PublicApiUnavailableError,
  type PublicApiRequest,
  type ServerRequestOptions,
} from "../src/forward";
import {
  HOUSEHOLD_CALCULATION_POLL_INTERVAL_MILLISECONDS,
  HOUSEHOLD_CALCULATION_TIME_LIMIT_MILLISECONDS,
  HouseholdCalculationFailedError,
  HouseholdCalculationRefusedError,
  HouseholdCalculationTimeoutError,
  createHouseholdCalculator,
  type HouseholdCalculatorDependencies,
  type InlineHouseholdCalculationRequest,
} from "../src/householdCalculation";
import { jsonResponse } from "./fixtures";

const CALCULATION_ID = "8a1f6b0e-3c2d-4e5f-9a7b-1c2d3e4f5a6b";
const CALCULATION_PATH = `/v2/household-calculations/${CALCULATION_ID}`;
const OBSERVABILITY_ID = "obs-4d2c1b0a";
const COUNTRY_PACKAGE_VERSION = "1.500.0";
const POLICYENGINE_VERSION = "3.4.0";

const US_SITUATION = {
  people: { you: { age: { 2026: 40 }, employment_income: { 2026: 50_000 } } },
  households: {
    your_household: {
      members: ["you"],
      household_net_income: { 2026: null },
    },
  },
};

const CALCULATED_US_SITUATION = {
  people: { you: { age: { 2026: 40 }, employment_income: { 2026: 50_000 } } },
  households: {
    your_household: {
      members: ["you"],
      household_net_income: { 2026: 44_210.5 },
    },
  },
};

const CHILD_TAX_CREDIT_REFORM = {
  "gov.irs.credits.ctc.amount.base[0].amount": {
    "2026-01-01.2100-12-31": 3000,
  },
};

const US_REFORM_REQUEST: InlineHouseholdCalculationRequest = {
  country: "us",
  household: US_SITUATION,
  policy: CHILD_TAX_CREDIT_REFORM,
};

const INVALID_INPUT_ERROR = {
  type: "unknown_variable",
  name: "employment_incme",
  path: "people.you.employment_incme",
  message: "employment_incme is not a variable of the US model.",
};

type CalculationStatus = "pending" | "running" | "succeeded" | "failed";

const EMPLOYMENT_INCOME_AXES = [
  [
    {
      name: "employment_income",
      count: 401,
      min: 0,
      max: 200_000,
      period: 2026,
    },
  ],
];

function submittedAnswer(): Response {
  return jsonResponse(
    {
      status: "ok",
      message: null,
      result: {
        item: {
          calculation_id: CALCULATION_ID,
          status: "pending",
          country_id: "us",
          household_id: null,
          policy_id: null,
          dynamic_id: null,
          year: 2026,
        },
      },
    },
    202,
  );
}

function calculationAnswer(
  status: CalculationStatus | "queued",
  outcome: { result?: unknown; error?: unknown } = {},
  calculationId = CALCULATION_ID,
): Response {
  return jsonResponse({
    status: "ok",
    message: null,
    result: {
      item: {
        calculation_id: calculationId,
        country_id: "us",
        household_id: null,
        policy_id: null,
        dynamic_id: null,
        year: 2026,
        catalog_version_id: "0b9d7c55-6e1f-4a2b-8c3d-4e5f6a7b8c9d",
        country_package_version: COUNTRY_PACKAGE_VERSION,
        policyengine_version: POLICYENGINE_VERSION,
        status,
        created_at: "2026-11-28T12:00:00Z",
        started_at: status === "pending" ? null : "2026-11-28T12:00:01Z",
        completed_at:
          status === "succeeded" || status === "failed"
            ? "2026-11-28T12:00:05Z"
            : null,
        result: outcome.result ?? null,
        error: outcome.error ?? null,
      },
    },
  });
}

function succeededAnswer(): Response {
  return calculationAnswer("succeeded", {
    result: {
      household: CALCULATED_US_SITUATION,
      warnings: ["Ignored input: rent"],
      spm_config: { geography_kind: "national" },
      spm_provenance: { forecast_content_sha256: "ab12" },
    },
  });
}

function errorAnswer(
  statusCode: number,
  message: string,
  extraFields: Record<string, unknown> = {},
  headers: Record<string, string> = {},
): Response {
  return jsonResponse(
    { status: "error", message, ...extraFields },
    statusCode,
    headers,
  );
}

/** An answer whose body is lost while it arrives: reading it rejects. */
function lostBodyAnswer(statusCode: number): Response {
  return new Response(
    new ReadableStream({
      start(controller) {
        controller.error(new TypeError("terminated"));
      },
    }),
    { status: statusCode, headers: { "Content-Type": "application/json" } },
  );
}

/** A 503 from Cloud Run in front of API v1: plain text, not API v1's envelope. */
function cloudRunUnavailableAnswer(): Response {
  return new Response("Service Unavailable", {
    status: 503,
    headers: { "Content-Type": "text/html" },
  });
}

type ScriptedAnswer = Response | Error;

interface RecordedRequest {
  readonly request: PublicApiRequest;
  readonly options: ServerRequestOptions | undefined;
  readonly atMilliseconds: number;
}

/**
 * A fake API v1 on a fake clock: each request gets the next answer that
 * `answerFor` gives, and each wait moves the clock on instead of sleeping.
 */
function fakeApiV1(
  answerFor: (request: PublicApiRequest) => ScriptedAnswer,
  overrides: Partial<HouseholdCalculatorDependencies> = {},
) {
  const clock = { milliseconds: 0 };
  const requests: RecordedRequest[] = [];
  const waits: number[] = [];
  const fetchFromServer = vi.fn(
    async (request: PublicApiRequest, options?: ServerRequestOptions) => {
      requests.push({ request, options, atMilliseconds: clock.milliseconds });
      const answer = answerFor(request);
      if (answer instanceof Error) {
        throw answer;
      }
      return answer;
    },
  );
  const calculator = createHouseholdCalculator({
    forwarder: { fetchFromServer },
    now: () => clock.milliseconds,
    wait: async (milliseconds, signal) => {
      signal?.throwIfAborted();
      waits.push(milliseconds);
      clock.milliseconds += milliseconds;
    },
    ...overrides,
  });
  const submissions = () =>
    requests.filter(({ request }) => request.method === "POST");
  const reads = () =>
    requests.filter(({ request }) => request.method === "GET");
  return { calculator, requests, submissions, reads, waits, clock };
}

/** Answers the requests in order from a list, failing on any request past its end. */
function inOrder(answers: ScriptedAnswer[]) {
  const remaining = [...answers];
  return (request: PublicApiRequest): ScriptedAnswer => {
    const answer = remaining.shift();
    if (answer === undefined) {
      throw new Error(
        `The test expected no request ${request.method} ${request.path}`,
      );
    }
    return answer;
  };
}

/** Answers the submission with `submission`, and every read with `readAnswer()`. */
function submissionThenEveryRead(
  submission: () => ScriptedAnswer,
  readAnswer: () => ScriptedAnswer,
) {
  return (request: PublicApiRequest): ScriptedAnswer =>
    request.method === "POST" ? submission() : readAnswer();
}

async function failureOf(promise: Promise<unknown>): Promise<unknown> {
  return promise.then(
    () => {
      throw new Error("Expected the calculation to fail, but it resolved.");
    },
    (error: unknown) => error,
  );
}

function submittedBody(recorded: RecordedRequest): unknown {
  return JSON.parse(recorded.request.body ?? "null");
}

describe("calculateHousehold", () => {
  test("given a calculation that finishes after several reads then it resolves with the calculated household", async () => {
    // Given
    const api = fakeApiV1(
      inOrder([
        submittedAnswer(),
        calculationAnswer("pending"),
        calculationAnswer("running"),
        succeededAnswer(),
      ]),
    );

    // When
    const calculated =
      await api.calculator.calculateHousehold(US_REFORM_REQUEST);

    // Then
    expect(calculated).toEqual({
      calculationId: CALCULATION_ID,
      household: CALCULATED_US_SITUATION,
      warnings: ["Ignored input: rent"],
      spmConfig: { geography_kind: "national" },
      spmProvenance: { forecast_content_sha256: "ab12" },
      countryPackageVersion: COUNTRY_PACKAGE_VERSION,
      policyengineVersion: POLICYENGINE_VERSION,
    });
    expect(api.requests.map(({ request }) => request.method)).toEqual([
      "POST",
      "GET",
      "GET",
      "GET",
    ]);
    expect(api.submissions()[0].request.path).toBe(
      "/v2/household-calculations",
    );
    expect(submittedBody(api.submissions()[0])).toEqual({
      country_id: "us",
      household: US_SITUATION,
      policy: CHILD_TAX_CREDIT_REFORM,
    });
    expect(api.reads().map(({ request }) => request.path)).toEqual([
      CALCULATION_PATH,
      CALCULATION_PATH,
      CALCULATION_PATH,
    ]);
    expect(api.waits).toEqual([2_000, 2_000, 2_000]);
  });

  test("given no policy and the missing-variable and SPM options then the submission sends the options and leaves policy out", async () => {
    // Given
    const api = fakeApiV1(inOrder([submittedAnswer(), succeededAnswer()]));

    // When
    await api.calculator.calculateHousehold({
      country: "us",
      household: US_SITUATION,
      addMissingVariables: true,
      spm: { geography_kind: "national" },
    });

    // Then
    expect(submittedBody(api.submissions()[0])).toEqual({
      country_id: "us",
      household: US_SITUATION,
      add_missing_variables: true,
      spm: { geography_kind: "national" },
    });
  });

  test("given a calculation that fails then it throws HouseholdCalculationFailedError with the job's error", async () => {
    // Given
    const api = fakeApiV1(
      inOrder([
        submittedAnswer(),
        calculationAnswer("running"),
        calculationAnswer("failed", {
          error: {
            code: "invalid_inputs",
            message: "The household names inputs the US model does not have.",
            input_errors: [INVALID_INPUT_ERROR],
            spm_error: null,
          },
        }),
      ]),
    );

    // When
    const failure = await failureOf(
      api.calculator.calculateHousehold(US_REFORM_REQUEST),
    );

    // Then
    expect(failure).toBeInstanceOf(HouseholdCalculationFailedError);
    expect(failure).toMatchObject({
      calculationId: CALCULATION_ID,
      code: "invalid_inputs",
      message: "The household names inputs the US model does not have.",
      inputErrors: [INVALID_INPUT_ERROR],
      spmError: null,
    });
    expect(api.reads()).toHaveLength(2);
  });

  test("given a calculation still running at its time limit then it reads once more at the deadline and throws HouseholdCalculationTimeoutError", async () => {
    // Given
    const api = fakeApiV1(
      submissionThenEveryRead(submittedAnswer, () =>
        calculationAnswer("running"),
      ),
    );

    // When
    const failure = await failureOf(
      api.calculator.calculateHousehold(US_REFORM_REQUEST, {
        timeLimitMilliseconds: 5_000,
      }),
    );

    // Then
    expect(failure).toBeInstanceOf(HouseholdCalculationTimeoutError);
    expect(failure).toMatchObject({
      calculationId: CALCULATION_ID,
      lastStatus: "running",
    });
    expect(api.waits).toEqual([2_000, 2_000, 1_000]);
    expect(api.reads().map(({ atMilliseconds }) => atMilliseconds)).toEqual([
      2_000, 4_000, 5_000,
    ]);
  });

  test("given the default settings then it reads every 2 seconds and gives up 10 minutes after it starts", async () => {
    // Given
    const api = fakeApiV1(
      submissionThenEveryRead(submittedAnswer, () =>
        calculationAnswer("pending"),
      ),
    );

    // When
    const failure = await failureOf(
      api.calculator.calculateHousehold(US_REFORM_REQUEST),
    );

    // Then
    expect(HOUSEHOLD_CALCULATION_POLL_INTERVAL_MILLISECONDS).toBe(2_000);
    expect(HOUSEHOLD_CALCULATION_TIME_LIMIT_MILLISECONDS).toBe(600_000);
    expect(failure).toBeInstanceOf(HouseholdCalculationTimeoutError);
    expect(new Set(api.waits)).toEqual(new Set([2_000]));
    expect(api.reads()).toHaveLength(300);
    expect(api.reads().at(-1)?.atMilliseconds).toBe(600_000);
  });

  test.each([429, 502, 503, 504])(
    "given a read answers %i then it waits one interval and reads again",
    async (statusCode) => {
      // Given
      const api = fakeApiV1(
        inOrder([
          submittedAnswer(),
          errorAnswer(statusCode, "Try again shortly"),
          succeededAnswer(),
        ]),
      );

      // When
      const calculated =
        await api.calculator.calculateHousehold(US_REFORM_REQUEST);

      // Then
      expect(calculated.household).toEqual(CALCULATED_US_SITUATION);
      expect(api.reads()).toHaveLength(2);
      expect(api.waits).toEqual([2_000, 2_000]);
    },
  );

  test("given a read answers 503 with Retry-After then it waits that many seconds before reading again", async () => {
    // Given
    const api = fakeApiV1(
      inOrder([
        submittedAnswer(),
        errorAnswer(503, "Storage is unavailable", {}, { "Retry-After": "7" }),
        succeededAnswer(),
      ]),
    );

    // When
    await api.calculator.calculateHousehold(US_REFORM_REQUEST);

    // Then
    expect(api.waits).toEqual([2_000, 7_000]);
  });

  test("given a read cannot reach API v1 then it reads again", async () => {
    // Given
    const api = fakeApiV1(
      inOrder([
        submittedAnswer(),
        new PublicApiUnavailableError("Could not be reached.", 502, true),
        succeededAnswer(),
      ]),
    );

    // When
    const calculated =
      await api.calculator.calculateHousehold(US_REFORM_REQUEST);

    // Then
    expect(calculated.calculationId).toBe(CALCULATION_ID);
    expect(api.reads()).toHaveLength(2);
  });

  test("given reads fail for 90 seconds without a good answer then it throws the last failure", async () => {
    // Given
    const api = fakeApiV1(
      submissionThenEveryRead(submittedAnswer, () =>
        errorAnswer(502, "Bad gateway"),
      ),
    );

    // When
    const failure = await failureOf(
      api.calculator.calculateHousehold(US_REFORM_REQUEST),
    );

    // Then
    expect(failure).toBeInstanceOf(HouseholdCalculationRefusedError);
    expect(failure).toMatchObject({
      statusCode: 502,
      calculationId: CALCULATION_ID,
    });
    expect(api.reads().at(-1)?.atMilliseconds).toBe(90_000);
    expect(api.reads()).toHaveLength(45);
  });

  test("given a read answers 404 then it throws HouseholdCalculationRefusedError without reading again", async () => {
    // Given
    const api = fakeApiV1(
      inOrder([
        submittedAnswer(),
        errorAnswer(404, `Household calculation ${CALCULATION_ID} not found.`),
      ]),
    );

    // When
    const failure = await failureOf(
      api.calculator.calculateHousehold(US_REFORM_REQUEST),
    );

    // Then
    expect(failure).toBeInstanceOf(HouseholdCalculationRefusedError);
    expect(failure).toMatchObject({
      statusCode: 404,
      message: `Household calculation ${CALCULATION_ID} not found.`,
      calculationId: CALCULATION_ID,
    });
    expect(api.reads()).toHaveLength(1);
  });

  test("given the submission answers 503 then it submits again after Retry-After", async () => {
    // Given
    const api = fakeApiV1(
      inOrder([
        errorAnswer(
          503,
          "The simulation service cannot be reached",
          {},
          { "Retry-After": "3" },
        ),
        submittedAnswer(),
        succeededAnswer(),
      ]),
    );

    // When
    const calculated =
      await api.calculator.calculateHousehold(US_REFORM_REQUEST);

    // Then
    expect(calculated.calculationId).toBe(CALCULATION_ID);
    expect(api.submissions()).toHaveLength(2);
    expect(api.waits).toEqual([3_000, 2_000]);
  });

  test("given the submission answers 502 then it throws without submitting again", async () => {
    // Given
    const api = fakeApiV1(
      inOrder([
        errorAnswer(
          502,
          "The simulation service's answer cannot be read; submitting again creates a second job if the first went through.",
        ),
      ]),
    );

    // When
    const failure = await failureOf(
      api.calculator.calculateHousehold(US_REFORM_REQUEST),
    );

    // Then
    expect(failure).toBeInstanceOf(HouseholdCalculationRefusedError);
    expect(failure).toMatchObject({ statusCode: 502, calculationId: null });
    expect(api.submissions()).toHaveLength(1);
  });

  test("given the submission may have reached API v1 before its connection failed then it throws without submitting again", async () => {
    // Given
    const timedOut = new PublicApiUnavailableError(
      "The Public API did not answer in time.",
      504,
      true,
    );
    const api = fakeApiV1(inOrder([timedOut]));

    // When
    const failure = await failureOf(
      api.calculator.calculateHousehold(US_REFORM_REQUEST),
    );

    // Then
    expect(failure).toBe(timedOut);
    expect(api.submissions()).toHaveLength(1);
  });

  test("given the credential cannot be obtained before submitting then it submits again", async () => {
    // Given
    const api = fakeApiV1(
      inOrder([
        new PublicApiUnavailableError(
          "Could not obtain a credential for the Public API.",
          502,
          false,
        ),
        submittedAnswer(),
        succeededAnswer(),
      ]),
    );

    // When
    const calculated =
      await api.calculator.calculateHousehold(US_REFORM_REQUEST);

    // Then
    expect(calculated.calculationId).toBe(CALCULATION_ID);
    expect(api.submissions()).toHaveLength(2);
  });

  test("given API v1 is not configured on the deployment then it throws without trying again", async () => {
    // Given
    const notConfigured = new PublicApiUnavailableError(
      "The Public API is not configured on this deployment.",
      503,
      false,
    );
    const api = fakeApiV1(inOrder([notConfigured]));

    // When
    const failure = await failureOf(
      api.calculator.calculateHousehold(US_REFORM_REQUEST),
    );

    // Then
    expect(failure).toBe(notConfigured);
    expect(api.requests).toHaveLength(1);
  });

  test("given API v1 refuses a policy with missing parameters then it throws HouseholdCalculationRefusedError with the code and body", async () => {
    // Given
    const refusalBody = {
      status: "error",
      message: "The policy sets parameters the running catalog does not have.",
      code: "missing_parameters",
      missing_parameters: ["gov.irs.credits.ctc.amount.base[0].amount"],
    };
    const api = fakeApiV1(
      inOrder([
        jsonResponse(refusalBody, 422, {
          "X-PolicyEngine-Observability-Id": OBSERVABILITY_ID,
        }),
      ]),
    );

    // When
    const failure = await failureOf(
      api.calculator.calculateHousehold(US_REFORM_REQUEST),
    );

    // Then
    expect(failure).toBeInstanceOf(HouseholdCalculationRefusedError);
    expect(failure).toMatchObject({
      statusCode: 422,
      code: "missing_parameters",
      message: refusalBody.message,
      body: refusalBody,
      observabilityId: OBSERVABILITY_ID,
      calculationId: null,
    });
    expect(api.requests).toHaveLength(1);
  });

  test("given an accepted submission without a calculation ID then it throws HouseholdCalculationRefusedError", async () => {
    // Given
    const api = fakeApiV1(
      inOrder([
        jsonResponse(
          { status: "ok", message: null, result: { item: {} } },
          202,
        ),
      ]),
    );

    // When
    const failure = await failureOf(
      api.calculator.calculateHousehold(US_REFORM_REQUEST),
    );

    // Then
    expect(failure).toBeInstanceOf(HouseholdCalculationRefusedError);
    expect(failure).toMatchObject({ statusCode: 202, calculationId: null });
  });

  test("given a signal then every request carries it", async () => {
    // Given
    const controller = new AbortController();
    const api = fakeApiV1(
      inOrder([
        submittedAnswer(),
        calculationAnswer("running"),
        succeededAnswer(),
      ]),
    );

    // When
    await api.calculator.calculateHousehold(US_REFORM_REQUEST, {
      signal: controller.signal,
    });

    // Then
    expect(api.requests).toHaveLength(3);
    for (const { options } of api.requests) {
      expect(options?.signal).toBe(controller.signal);
    }
  });

  test("given the signal aborts during a wait then it rejects with the abort reason and reads no more", async () => {
    // Given
    const controller = new AbortController();
    const callerLeft = new Error("The caller went away.");
    const api = fakeApiV1(
      submissionThenEveryRead(submittedAnswer, () =>
        calculationAnswer("running"),
      ),
      {
        wait: async (_milliseconds, signal) => {
          controller.abort(callerLeft);
          signal?.throwIfAborted();
        },
      },
    );

    // When
    const failure = await failureOf(
      api.calculator.calculateHousehold(US_REFORM_REQUEST, {
        signal: controller.signal,
      }),
    );

    // Then
    expect(failure).toBe(callerLeft);
    expect(api.reads()).toHaveLength(0);
  });

  test.each([
    ["not a number", Number.NaN],
    ["negative", -1],
    ["a string", "600000" as unknown as number],
  ])(
    "given a time limit that is %s then it rejects with RangeError before submitting",
    async (_description, timeLimitMilliseconds) => {
      // Given
      const api = fakeApiV1(inOrder([submittedAnswer(), succeededAnswer()]));

      // When
      const failure = await failureOf(
        api.calculator.calculateHousehold(US_REFORM_REQUEST, {
          timeLimitMilliseconds,
        }),
      );

      // Then
      expect(failure).toBeInstanceOf(RangeError);
      expect(api.requests).toHaveLength(0);
    },
  );

  test("given an infinite time limit then it keeps reading until the calculation finishes", async () => {
    // Given
    const api = fakeApiV1(
      inOrder([
        submittedAnswer(),
        ...Array.from({ length: 400 }, () => calculationAnswer("running")),
        succeededAnswer(),
      ]),
    );

    // When
    const calculated = await api.calculator.calculateHousehold(
      US_REFORM_REQUEST,
      { timeLimitMilliseconds: Number.POSITIVE_INFINITY },
    );

    // Then
    expect(calculated.calculationId).toBe(CALCULATION_ID);
    expect(api.reads()).toHaveLength(401);
  });
  test("given a household with axes then the submission sends them as a separate axes field", async () => {
    // Given
    const householdWithAxes = { ...US_SITUATION, axes: EMPLOYMENT_INCOME_AXES };
    const api = fakeApiV1(inOrder([submittedAnswer(), succeededAnswer()]));

    // When
    await api.calculator.calculateHousehold({
      country: "us",
      household: householdWithAxes,
      policy: CHILD_TAX_CREDIT_REFORM,
    });

    // Then
    expect(submittedBody(api.submissions()[0])).toEqual({
      country_id: "us",
      household: US_SITUATION,
      policy: CHILD_TAX_CREDIT_REFORM,
      axes: EMPLOYMENT_INCOME_AXES,
    });
    expect(householdWithAxes.axes).toBe(EMPLOYMENT_INCOME_AXES);
  });

  test("given the default time limit then the submission may take until the deadline and each read 30 seconds", async () => {
    // Given
    const api = fakeApiV1(
      inOrder([
        submittedAnswer(),
        calculationAnswer("running"),
        succeededAnswer(),
      ]),
    );

    // When
    await api.calculator.calculateHousehold(US_REFORM_REQUEST);

    // Then
    expect(api.submissions()[0].options?.timeoutMilliseconds).toBe(600_000);
    expect(
      api.reads().map(({ options }) => options?.timeoutMilliseconds),
    ).toEqual([30_000, 30_000]);
  });

  test("given a short time limit then the submission still gets 30 seconds", async () => {
    // Given
    const api = fakeApiV1(inOrder([submittedAnswer(), succeededAnswer()]));

    // When
    await api.calculator.calculateHousehold(US_REFORM_REQUEST, {
      timeLimitMilliseconds: 5_000,
    });

    // Then
    expect(api.submissions()[0].options?.timeoutMilliseconds).toBe(30_000);
  });

  test("given the submission gets a 503 that is not API v1's own then it throws without submitting again", async () => {
    // Given
    const api = fakeApiV1(inOrder([cloudRunUnavailableAnswer()]));

    // When
    const failure = await failureOf(
      api.calculator.calculateHousehold(US_REFORM_REQUEST),
    );

    // Then
    expect(failure).toBeInstanceOf(HouseholdCalculationRefusedError);
    expect(failure).toMatchObject({ statusCode: 503, body: null });
    expect(api.submissions()).toHaveLength(1);
  });

  test("given a submission retry would wait until the deadline then it throws the last failure without submitting again", async () => {
    // Given
    const api = fakeApiV1(
      inOrder([
        errorAnswer(503, "No job will run", {}, { "Retry-After": "10" }),
      ]),
    );

    // When
    const failure = await failureOf(
      api.calculator.calculateHousehold(US_REFORM_REQUEST, {
        timeLimitMilliseconds: 5_000,
      }),
    );

    // Then
    expect(failure).toBeInstanceOf(HouseholdCalculationRefusedError);
    expect(failure).toMatchObject({ statusCode: 503 });
    expect(api.submissions()).toHaveLength(1);
    expect(api.waits).toEqual([]);
  });

  test("given a time limit of 0 then it submits, reads once and throws HouseholdCalculationTimeoutError", async () => {
    // Given
    const api = fakeApiV1(
      inOrder([submittedAnswer(), calculationAnswer("running")]),
    );

    // When
    const failure = await failureOf(
      api.calculator.calculateHousehold(US_REFORM_REQUEST, {
        timeLimitMilliseconds: 0,
      }),
    );

    // Then
    expect(failure).toBeInstanceOf(HouseholdCalculationTimeoutError);
    expect(failure).toMatchObject({ lastStatus: "running" });
    expect(api.reads()).toHaveLength(1);
  });

  test("given the submission's connection fails after sending then it throws without submitting again", async () => {
    // Given
    const connectionLost = new PublicApiUnavailableError(
      "The Public API could not be reached.",
      502,
      true,
    );
    const api = fakeApiV1(inOrder([connectionLost]));

    // When
    const failure = await failureOf(
      api.calculator.calculateHousehold(US_REFORM_REQUEST),
    );

    // Then
    expect(failure).toBe(connectionLost);
    expect(api.submissions()).toHaveLength(1);
  });

  test("given the submission's answer is lost while it arrives then it throws without submitting again", async () => {
    // Given
    const api = fakeApiV1(inOrder([lostBodyAnswer(202)]));

    // When
    const failure = await failureOf(
      api.calculator.calculateHousehold(US_REFORM_REQUEST),
    );

    // Then
    expect(failure).toBeInstanceOf(PublicApiUnavailableError);
    expect(failure).toMatchObject({ requestMayHaveArrived: true });
    expect(api.submissions()).toHaveLength(1);
  });

  test("given the submission answers 429 then it throws without submitting again", async () => {
    // Given
    const api = fakeApiV1(inOrder([errorAnswer(429, "Too many requests")]));

    // When
    const failure = await failureOf(
      api.calculator.calculateHousehold(US_REFORM_REQUEST),
    );

    // Then
    expect(failure).toMatchObject({ statusCode: 429 });
    expect(api.submissions()).toHaveLength(1);
  });

  test("given the submission answers 503 for 90 seconds then it throws the last answer", async () => {
    // Given
    const api = fakeApiV1(() => errorAnswer(503, "No job will run"));

    // When
    const failure = await failureOf(
      api.calculator.calculateHousehold(US_REFORM_REQUEST),
    );

    // Then
    expect(failure).toBeInstanceOf(HouseholdCalculationRefusedError);
    expect(failure).toMatchObject({ statusCode: 503 });
    expect(api.submissions().at(-1)?.atMilliseconds).toBe(90_000);
    expect(api.submissions()).toHaveLength(46);
  });

  test("given a read's answer is lost while it arrives then it reads again", async () => {
    // Given
    const api = fakeApiV1(
      inOrder([submittedAnswer(), lostBodyAnswer(200), succeededAnswer()]),
    );

    // When
    const calculated =
      await api.calculator.calculateHousehold(US_REFORM_REQUEST);

    // Then
    expect(calculated.calculationId).toBe(CALCULATION_ID);
    expect(api.reads()).toHaveLength(2);
  });

  test("given the credential cannot be obtained for a read then it reads again", async () => {
    // Given
    const api = fakeApiV1(
      inOrder([
        submittedAnswer(),
        new PublicApiUnavailableError(
          "Could not obtain a credential for the Public API.",
          502,
          false,
        ),
        succeededAnswer(),
      ]),
    );

    // When
    const calculated =
      await api.calculator.calculateHousehold(US_REFORM_REQUEST);

    // Then
    expect(calculated.calculationId).toBe(CALCULATION_ID);
    expect(api.reads()).toHaveLength(2);
  });

  test("given API v1 is no longer configured when it reads then it throws without reading again", async () => {
    // Given
    const notConfigured = new PublicApiUnavailableError(
      "The Public API is not configured on this deployment.",
      503,
      false,
    );
    const api = fakeApiV1(inOrder([submittedAnswer(), notConfigured]));

    // When
    const failure = await failureOf(
      api.calculator.calculateHousehold(US_REFORM_REQUEST),
    );

    // Then
    expect(failure).toBe(notConfigured);
    expect(api.reads()).toHaveLength(1);
  });

  test("given a read answers 429 with Retry-After then it waits that many seconds", async () => {
    // Given
    const api = fakeApiV1(
      inOrder([
        submittedAnswer(),
        errorAnswer(429, "Too many requests", {}, { "Retry-After": "5" }),
        succeededAnswer(),
      ]),
    );

    // When
    await api.calculator.calculateHousehold(US_REFORM_REQUEST);

    // Then
    expect(api.waits).toEqual([2_000, 5_000]);
  });

  test("given a Retry-After that is a date then it waits one interval", async () => {
    // Given
    const api = fakeApiV1(
      inOrder([
        submittedAnswer(),
        errorAnswer(
          503,
          "Storage is unavailable",
          {},
          { "Retry-After": "Sat, 28 Nov 2026 12:00:00 GMT" },
        ),
        succeededAnswer(),
      ]),
    );

    // When
    await api.calculator.calculateHousehold(US_REFORM_REQUEST);

    // Then
    expect(api.waits).toEqual([2_000, 2_000]);
  });

  test.each([
    [
      "another calculation's ID",
      () =>
        calculationAnswer(
          "running",
          {},
          "00000000-0000-4000-8000-000000000000",
        ),
    ],
    ["an unknown status", () => calculationAnswer("queued")],
    ["a failure without its error", () => calculationAnswer("failed")],
    ["a success without its result", () => calculationAnswer("succeeded")],
  ])(
    "given a read answer with %s then it throws HouseholdCalculationRefusedError",
    async (_description, unreadableAnswer) => {
      // Given
      const api = fakeApiV1(inOrder([submittedAnswer(), unreadableAnswer()]));

      // When
      const failure = await failureOf(
        api.calculator.calculateHousehold(US_REFORM_REQUEST),
      );

      // Then
      expect(failure).toBeInstanceOf(HouseholdCalculationRefusedError);
      expect(failure).toMatchObject({
        statusCode: 200,
        calculationId: CALCULATION_ID,
      });
      expect(api.reads()).toHaveLength(1);
    },
  );

  test("given a failure without a code then HouseholdCalculationFailedError has a null code", async () => {
    // Given
    const api = fakeApiV1(
      inOrder([
        submittedAnswer(),
        calculationAnswer("failed", {
          error: {
            code: null,
            message: "household_function_error: worker ran out of memory",
            input_errors: [],
            spm_error: null,
          },
        }),
      ]),
    );

    // When
    const failure = await failureOf(
      api.calculator.calculateHousehold(US_REFORM_REQUEST),
    );

    // Then
    expect(failure).toBeInstanceOf(HouseholdCalculationFailedError);
    expect(failure).toMatchObject({
      code: null,
      message: "household_function_error: worker ran out of memory",
      inputErrors: [],
    });
  });

  test("given the signal aborts while an answer arrives then it rejects with the abort reason", async () => {
    // Given
    const controller = new AbortController();
    const callerLeft = new Error("The caller went away.");
    const abortingAnswer = new Response(
      new ReadableStream({
        start(streamController) {
          controller.abort(callerLeft);
          streamController.error(new DOMException("aborted", "AbortError"));
        },
      }),
      { status: 202 },
    );
    const api = fakeApiV1(inOrder([abortingAnswer]));

    // When
    const failure = await failureOf(
      api.calculator.calculateHousehold(US_REFORM_REQUEST, {
        signal: controller.signal,
      }),
    );

    // Then
    expect(failure).toBe(callerLeft);
  });
});
