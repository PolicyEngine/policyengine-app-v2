// Turns a household calculation on API v1's /v2/household-calculations into
// the answer POST /{country}/calculate gave, so the dashboards that call
// POST /api/household/calculate get the same envelope, {status, message,
// result}, and the same status for each outcome of a calculation.

import {
  HouseholdCalculationFailedError,
  HouseholdCalculationRefusedError,
  HouseholdCalculationTimeoutError,
  PublicApiUnavailableError,
  errorResponse,
  type CalculatedHousehold,
  type ForwardingLogger,
  type HouseholdCalculator,
  type InlineHouseholdCalculationRequest,
} from "@policyengine/public-api-forwarding";

import {
  NO_ANSWER_IDS,
  OBSERVABILITY_ID_HEADER,
  REQUEST_ID_HEADER,
  type ApiV1AnswerIds,
} from "@/lib/publicApi/apiV1AnswerIds";

export interface HouseholdCalculationAnswerOptions {
  /** The browser's request: the calculation stops when its signal aborts. */
  readonly incomingRequest: Request;
  /** Headers added to every answer, such as CORS headers. */
  readonly responseHeaders?: HeadersInit;
  readonly logger?: Pick<ForwardingLogger, "error">;
  /**
   * The IDs of API v1's answer to the calculation's submission, which a
   * calculated household's or a failed calculation's answer carries, as
   * /calculate's answer carried those of the request that ran it. Neither
   * is sent without it.
   */
  readonly submissionAnswerIds?: () => ApiV1AnswerIds;
}

/**
 * The household function's error codes for a household the model can't
 * calculate as given, which /calculate answered with 400.
 */
const INPUT_FAILURE_CODES: ReadonlySet<string | null> = new Set([
  "invalid_inputs",
  "invalid_household",
  "invalid_spm_selection",
]);

/**
 * The start of /calculate's message for a calculation that failed
 * unexpectedly. The household function already starts a
 * "calculation_failed" message with it.
 */
const UNEXPECTED_FAILURE_PREFIX = "Error calculating household under policy: ";

/** Bytes per part of a streamed answer. */
const STREAMED_PART_BYTES = 64 * 1024;

/**
 * A body sent in parts, not buffered: Vercel caps a buffered function
 * answer at 4.5 MB, and a household with axes can be far larger.
 */
function streamedText(text: string): ReadableStream<Uint8Array> {
  const bytes = new TextEncoder().encode(text);
  let offset = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (offset >= bytes.byteLength) {
        controller.close();
        return;
      }
      controller.enqueue(bytes.subarray(offset, offset + STREAMED_PART_BYTES));
      offset += STREAMED_PART_BYTES;
    },
  });
}

/** One of API v1's own answers, rebuilt; unlike errorResponse, unmarked. */
function apiV1Answer(
  statusCode: number,
  body: Record<string, unknown>,
  responseHeaders: HeadersInit | undefined,
): Response {
  const headers = new Headers(responseHeaders);
  headers.set("Content-Type", "application/json");
  headers.set("Cache-Control", "no-store");
  return new Response(streamedText(JSON.stringify(body)), {
    status: statusCode,
    headers,
  });
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** The headers given, with API v1's answer IDs that are known. */
function withAnswerIds(
  responseHeaders: HeadersInit | undefined,
  answerIds: ApiV1AnswerIds,
): Headers {
  const headers = new Headers(responseHeaders);
  if (answerIds.requestId !== null) {
    headers.set(REQUEST_ID_HEADER, answerIds.requestId);
  }
  if (answerIds.observabilityId !== null) {
    headers.set(OBSERVABILITY_ID_HEADER, answerIds.observabilityId);
  }
  return headers;
}

/** /calculate's answer for a calculated household. */
function calculatedAnswer(calculated: CalculatedHousehold) {
  return {
    status: "ok",
    message: null,
    result: calculated.household,
    ...(calculated.warnings.length > 0
      ? { warnings: [...calculated.warnings] }
      : {}),
    ...(calculated.spmProvenance === null
      ? {}
      : { spm_provenance: calculated.spmProvenance }),
  };
}

/**
 * /calculate's answer for a calculation that failed: 400, with each
 * problem in `errors`, for a household the model can't calculate as given;
 * 500 otherwise.
 */
function failedAnswer(
  failure: HouseholdCalculationFailedError,
  responseHeaders: HeadersInit | undefined,
  logger: Pick<ForwardingLogger, "error">,
): Response {
  if (INPUT_FAILURE_CODES.has(failure.code)) {
    const errors =
      failure.code === "invalid_spm_selection"
        ? failure.spmError === null
          ? []
          : [failure.spmError]
        : failure.inputErrors;
    return apiV1Answer(
      400,
      {
        status: "error",
        message: failure.message,
        result: null,
        ...(errors.length > 0 ? { errors } : {}),
      },
      responseHeaders,
    );
  }
  logger.error(
    `Household calculation ${failure.calculationId} failed (code ${failure.code ?? "none"}): ${failure.message}`,
  );
  return apiV1Answer(
    500,
    {
      status: "error",
      message: failure.message.startsWith(UNEXPECTED_FAILURE_PREFIX)
        ? failure.message
        : `${UNEXPECTED_FAILURE_PREFIX}${failure.message}`,
    },
    responseHeaders,
  );
}

/**
 * API v1's refusal, as /calculate would have given it: its status, message
 * and `errors`, except that a household API v1 refuses as invalid (422)
 * answers 400, as /calculate did. The route answers for API v1 itself, as
 * the forwarder did, when API v1's answer can't be read (a success status),
 * is a redirect, or isn't API v1's JSON, such as a load balancer's error;
 * and when API v1 refuses to read a calculation it accepted, which no
 * fault of the caller's explains, except for a rate limit.
 */
function refusedAnswer(
  refusal: HouseholdCalculationRefusedError,
  responseHeaders: HeadersInit | undefined,
  logger: Pick<ForwardingLogger, "error">,
): Response {
  const requestDescription = `HTTP ${refusal.statusCode}, request ${refusal.requestId ?? "unknown"}`;
  if (refusal.statusCode < 300) {
    logger.error(
      `API v1's answer for a household calculation could not be read (${requestDescription}): ${refusal.message}`,
    );
    return errorResponse(
      502,
      "API v1's answer could not be read.",
      responseHeaders,
    );
  }
  if (refusal.statusCode < 400) {
    logger.error(
      `API v1 answered a household calculation with a redirect (${requestDescription}).`,
    );
    return errorResponse(
      502,
      "API v1 answered with a redirect.",
      responseHeaders,
    );
  }
  if (
    refusal.calculationId !== null &&
    refusal.statusCode < 500 &&
    refusal.statusCode !== 429
  ) {
    logger.error(
      `API v1 refused to read household calculation ${refusal.calculationId} (${requestDescription}): ${refusal.message}`,
    );
    return errorResponse(
      502,
      "API v1 could not read the household calculation it accepted.",
      responseHeaders,
    );
  }
  if (refusal.statusCode >= 500) {
    logger.error(
      `API v1 answered a household calculation with ${requestDescription}: ${refusal.message}`,
    );
  }

  const headers = withAnswerIds(responseHeaders, refusal);
  if (refusal.retryAfterSeconds !== null) {
    headers.set("Retry-After", String(refusal.retryAfterSeconds));
  }
  if (!isJsonObject(refusal.body) || refusal.body.status !== "error") {
    return errorResponse(refusal.statusCode, refusal.message, headers);
  }
  const errors = refusal.body.errors;
  return apiV1Answer(
    refusal.statusCode === 422 ? 400 : refusal.statusCode,
    {
      status: "error",
      message: refusal.message,
      result: null,
      ...(Array.isArray(errors) && errors.length > 0 ? { errors } : {}),
    },
    headers,
  );
}

/**
 * Calculates the household through `calculator` and answers as
 * POST /{country}/calculate did. Never throws.
 */
export async function householdCalculationAnswer(
  calculator: HouseholdCalculator,
  request: InlineHouseholdCalculationRequest,
  options: HouseholdCalculationAnswerOptions,
): Promise<Response> {
  const { incomingRequest, responseHeaders } = options;
  const logger = options.logger ?? console;
  const signal = incomingRequest.signal;
  const submissionAnswerHeaders = () =>
    withAnswerIds(
      responseHeaders,
      options.submissionAnswerIds?.() ?? NO_ANSWER_IDS,
    );

  let calculated: CalculatedHousehold;
  try {
    calculated = await calculator.calculateHousehold(request, { signal });
  } catch (error) {
    if (signal.aborted) {
      // The browser has gone; nobody will read this answer.
      return errorResponse(
        502,
        "The browser closed the request.",
        responseHeaders,
      );
    }
    if (error instanceof HouseholdCalculationFailedError) {
      return failedAnswer(error, submissionAnswerHeaders(), logger);
    }
    if (error instanceof HouseholdCalculationRefusedError) {
      return refusedAnswer(error, responseHeaders, logger);
    }
    if (error instanceof HouseholdCalculationTimeoutError) {
      logger.error(
        `Household calculation ${error.calculationId} did not finish in time (last status ${error.lastStatus}).`,
      );
      return errorResponse(
        504,
        "The household calculation did not finish in time.",
        responseHeaders,
      );
    }
    if (error instanceof PublicApiUnavailableError) {
      // fetchFromServer logs every other reason itself; the helper finds
      // a lost answer while reading it.
      if (error.reason === "answer_lost") {
        logger.error(
          `API v1's answer for a household calculation was lost: ${error.message}`,
        );
      }
      return errorResponse(error.statusCode, error.message, responseHeaders);
    }
    logger.error(
      "Could not calculate a household:",
      error instanceof Error ? error.message : error,
    );
    return errorResponse(
      500,
      "The household could not be calculated.",
      responseHeaders,
    );
  }
  return apiV1Answer(
    200,
    calculatedAnswer(calculated),
    submissionAnswerHeaders(),
  );
}
