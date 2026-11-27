// Turns a household calculation on API v1's /v2/household-calculations into
// the answer POST /{country}/calculate gave, so the dashboards that call
// POST /api/household/calculate see no change: {status, message, result},
// with the same HTTP statuses.

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

export interface HouseholdCalculationAnswerOptions {
  /** The browser's request: the calculation stops when its signal aborts. */
  readonly incomingRequest: Request;
  /** Headers added to every answer, such as CORS headers. */
  readonly responseHeaders?: HeadersInit;
  readonly logger?: Pick<ForwardingLogger, "error">;
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
  extraHeaders: Record<string, string> = {},
): Response {
  const headers = new Headers(responseHeaders);
  headers.set("Content-Type", "application/json");
  headers.set("Cache-Control", "no-store");
  for (const [name, value] of Object.entries(extraHeaders)) {
    headers.set(name, value);
  }
  return new Response(streamedText(JSON.stringify(body)), {
    status: statusCode,
    headers,
  });
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
      message: `Error calculating household under policy: ${failure.message}`,
      result: null,
    },
    responseHeaders,
  );
}

/**
 * API v1's refusal, as /calculate would have given it: its status and
 * message, except that a household API v1 refuses as invalid (422) answers
 * 400, as /calculate did. A success status means API v1's answer could not
 * be read, which is the route's own 502.
 */
function refusedAnswer(
  refusal: HouseholdCalculationRefusedError,
  responseHeaders: HeadersInit | undefined,
  logger: Pick<ForwardingLogger, "error">,
): Response {
  if (refusal.statusCode < 300) {
    logger.error(
      `API v1's answer for a household calculation could not be read (HTTP ${refusal.statusCode}, request ${refusal.requestId ?? "unknown"}): ${refusal.message}`,
    );
    return errorResponse(502, refusal.message, responseHeaders);
  }
  if (refusal.statusCode >= 500) {
    logger.error(
      `API v1 answered a household calculation with HTTP ${refusal.statusCode} (request ${refusal.requestId ?? "unknown"}): ${refusal.message}`,
    );
  }
  return apiV1Answer(
    refusal.statusCode === 422 ? 400 : refusal.statusCode,
    { status: "error", message: refusal.message, result: null },
    responseHeaders,
    refusal.retryAfterSeconds === null
      ? {}
      : { "Retry-After": String(refusal.retryAfterSeconds) },
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
      return failedAnswer(error, responseHeaders, logger);
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
      // fetchFromServer has logged why.
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
  return apiV1Answer(200, calculatedAnswer(calculated), responseHeaders);
}
