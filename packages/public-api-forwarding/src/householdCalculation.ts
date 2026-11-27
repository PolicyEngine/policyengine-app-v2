// Calculates a household on API v1 without storing it. The household, in
// the situation shape POST /{country}/calculate takes, goes to
// POST /v2/household-calculations; the helper then reads
// GET /v2/household-calculations/{calculation_id} until the calculation
// succeeds or fails. API v1 keeps the calculation as a household job only,
// with no stored household, policy or user association.
//
// For server code: every request goes through the forwarder's
// fetchFromServer, which adds the server credential.

import {
  DEFAULT_SERVER_REQUEST_TIMEOUT_MILLISECONDS,
  PublicApiUnavailableError,
  type PublicApiForwarder,
  type PublicApiRequest,
  type PublicApiUnavailableReason,
} from "./forward";

/** How long the helper waits between reads of a calculation. */
export const HOUSEHOLD_CALCULATION_POLL_INTERVAL_MILLISECONDS = 2_000;
/** How long after it starts the helper gives up on a calculation. */
export const HOUSEHOLD_CALCULATION_TIME_LIMIT_MILLISECONDS = 10 * 60_000;
/**
 * How long brief outages are retried without a good answer from API v1
 * before the helper gives up and throws the last failure.
 */
export const HOUSEHOLD_CALCULATION_OUTAGE_LIMIT_MILLISECONDS = 90_000;

const SUBMISSION_PATH = "/v2/household-calculations";
/** Read answers that a brief outage or a rate limit explains. */
const RETRIED_READ_STATUSES = new Set([429, 502, 503, 504]);
/**
 * The submission answer after which API v1 says no job will run, so
 * submitting again cannot create a second one. It counts only with API v1's
 * own error body: Cloud Run, in front of API v1, also answers 503 when its
 * connection to an instance fails mid-request, after which the job may
 * exist. A 502 is never retried: API v1 answers it when the job may exist.
 */
const RETRIED_SUBMISSION_STATUSES = new Set([503]);
/** Answers whose Retry-After the helper waits out. */
const RETRY_AFTER_STATUSES = new Set([429, 503]);
const OBSERVABILITY_ID_HEADER = "x-policyengine-observability-id";
const REQUEST_ID_HEADER = "x-policyengine-request-id";
/** setTimeout runs any longer delay at once, so no wait is longer. */
const LONGEST_TIMER_MILLISECONDS = 2 ** 31 - 1;
/** A calculation ID is a UUID; this also keeps it one path segment. */
const CALCULATION_ID_PATTERN = /^[0-9A-Fa-f-]{1,64}$/;

export type HouseholdCalculationCountry = "us" | "uk";
export type HouseholdCalculationStatus =
  | "pending"
  | "running"
  | "succeeded"
  | "failed";
/** The statuses of a calculation that has not finished yet. */
export type HouseholdCalculationUnfinishedStatus = "pending" | "running";

type JsonObject = Record<string, unknown>;

/** A household to calculate, as POST /{country}/calculate takes it. */
export interface InlineHouseholdCalculationRequest {
  readonly country: HouseholdCalculationCountry;
  /**
   * The household in the situation shape. Its `axes`, if any, are sent as
   * the request's own `axes` field, which is where API v1 takes them.
   */
  readonly household: Readonly<Record<string, unknown>>;
  /**
   * Parameter changes keyed by parameter path, each mapping a period such as
   * "2026-01-01.2100-12-31" to a value. Current law when omitted.
   */
  readonly policy?: Readonly<Record<string, unknown>>;
  /** Adds every variable the household lacks, as /calculate-full does. */
  readonly addMissingVariables?: boolean;
  /** SPM settings for a US household. */
  readonly spm?: Readonly<Record<string, unknown>>;
}

export interface HouseholdCalculationOptions {
  /** Stops the requests in flight and any wait, rejecting with its reason. */
  readonly signal?: AbortSignal;
  /**
   * How long after the call starts to give up, 10 minutes by default. The
   * last read happens at the deadline, and an accepted calculation is read
   * at least once. A request in flight at the deadline may take up to 30
   * seconds more.
   */
  readonly timeLimitMilliseconds?: number;
}

/** A calculation that succeeded. */
export interface CalculatedHousehold {
  readonly calculationId: string;
  /**
   * The household with each calculated value filled in by period, in the
   * shape /calculate answered as `result`.
   */
  readonly household: Record<string, unknown>;
  /** Inputs the country model ignored. */
  readonly warnings: readonly string[];
  /** For a US household, the SPM selection the calculation applied. */
  readonly spmConfig: Record<string, unknown> | null;
  /** For a US household, the receipt of the SPM forecast it used. */
  readonly spmProvenance: Record<string, unknown> | null;
  readonly countryPackageVersion: string;
  readonly policyengineVersion: string;
}

export interface HouseholdCalculatorDependencies {
  readonly forwarder: Pick<PublicApiForwarder, "fetchFromServer">;
  /** The current time in milliseconds; Date.now by default. */
  readonly now?: () => number;
  /** Waits, rejecting with the signal's reason when it aborts; a timer by default. */
  readonly wait?: (milliseconds: number, signal?: AbortSignal) => Promise<void>;
}

export interface HouseholdCalculator {
  /**
   * Submits the household and reads the calculation until it finishes.
   * Resolves with the calculated household. Throws
   * HouseholdCalculationFailedError when the calculation fails,
   * HouseholdCalculationTimeoutError when the time limit passes,
   * HouseholdCalculationRefusedError when API v1 refuses a request or its
   * answer cannot be read, and PublicApiUnavailableError when API v1 cannot
   * be called.
   */
  calculateHousehold(
    request: InlineHouseholdCalculationRequest,
    options?: HouseholdCalculationOptions,
  ): Promise<CalculatedHousehold>;
}

/** The calculation ran and failed. */
export class HouseholdCalculationFailedError extends Error {
  override name = "HouseholdCalculationFailedError";

  constructor(
    message: string,
    readonly calculationId: string,
    /**
     * The household function's error code, such as "invalid_inputs". Null
     * when the function raised or was cancelled; submitting again may then
     * succeed.
     */
    readonly code: string | null,
    /** For "invalid_inputs", each input the country model does not recognise. */
    readonly inputErrors: readonly Record<string, unknown>[],
    /** For "invalid_spm_selection", what is wrong with the SPM settings. */
    readonly spmError: Record<string, unknown> | null,
  ) {
    super(message);
  }
}

/**
 * The time limit passed before the calculation finished. API v1 may still
 * finish it; GET /v2/household-calculations/{calculationId} reads it.
 */
export class HouseholdCalculationTimeoutError extends Error {
  override name = "HouseholdCalculationTimeoutError";

  constructor(
    message: string,
    readonly calculationId: string,
    /**
     * The status the last successful read gave, or the submission's when no
     * read succeeded. It is "succeeded" or "failed" only when the
     * submission's answer said so and no read could get the outcome before
     * the deadline.
     */
    readonly lastStatus: HouseholdCalculationStatus,
  ) {
    super(message);
  }
}

export interface HouseholdCalculationRefusal {
  /** The HTTP status of API v1's answer. */
  readonly statusCode: number;
  /** The answer's parsed body, or null when it was empty or not JSON. */
  readonly body: unknown;
  /** API v1's error code, such as "missing_parameters", when it gave one. */
  readonly code: string | null;
  /** Seconds from the answer's Retry-After, when it had one. */
  readonly retryAfterSeconds: number | null;
  readonly observabilityId: string | null;
  readonly requestId: string | null;
  /** The calculation the answer concerns, or null before one was accepted. */
  readonly calculationId: string | null;
}

/**
 * API v1 refused a request, failed with an error status, or answered in a
 * shape the helper cannot read. The message is API v1's, when it gave one.
 */
export class HouseholdCalculationRefusedError
  extends Error
  implements HouseholdCalculationRefusal
{
  override name = "HouseholdCalculationRefusedError";
  readonly statusCode: number;
  readonly body: unknown;
  readonly code: string | null;
  readonly retryAfterSeconds: number | null;
  readonly observabilityId: string | null;
  readonly requestId: string | null;
  readonly calculationId: string | null;

  constructor(message: string, refusal: HouseholdCalculationRefusal) {
    super(message);
    this.statusCode = refusal.statusCode;
    this.body = refusal.body;
    this.code = refusal.code;
    this.retryAfterSeconds = refusal.retryAfterSeconds;
    this.observabilityId = refusal.observabilityId;
    this.requestId = refusal.requestId;
    this.calculationId = refusal.calculationId;
  }
}

interface ApiV1Answer {
  readonly response: Response;
  readonly body: unknown;
}

interface SubmittedCalculation {
  readonly calculationId: string;
  /**
   * Usually "pending". The simulation service answers with the job's
   * current status, so a fast job can already have finished.
   */
  readonly status: HouseholdCalculationStatus;
}

const CALCULATION_STATUSES: ReadonlySet<unknown> = new Set([
  "pending",
  "running",
  "succeeded",
  "failed",
]);

function isCalculationStatus(
  value: unknown,
): value is HouseholdCalculationStatus {
  return CALCULATION_STATUSES.has(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

/** A list of strings; an absent list is empty; anything else is undefined. */
function stringsOrUndefined(value: unknown): string[] | undefined {
  if (value === undefined || value === null) {
    return [];
  }
  return Array.isArray(value) && value.every(isString) ? value : undefined;
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function objectOrNull(value: unknown): JsonObject | null | undefined {
  if (value === undefined || value === null) {
    return null;
  }
  return isJsonObject(value) ? value : undefined;
}

function retryAfterSeconds(response: Response): number | null {
  const value = response.headers.get("retry-after");
  if (value === null) {
    return null;
  }
  // A delay is decimal digits only; a date, or anything else, is ignored.
  const digits = value.trim();
  return /^[0-9]+$/.test(digits) ? Number(digits) : null;
}

function waitWithTimer(
  milliseconds: number,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal?.reason);
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, milliseconds);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/**
 * API v1's inline request: the situation without its axes, which go in the
 * request's own `axes` field.
 */
function submissionBody(
  request: InlineHouseholdCalculationRequest,
): JsonObject {
  const { axes, ...householdWithoutAxes } = request.household;
  return {
    country_id: request.country,
    household: householdWithoutAxes,
    ...(request.policy === undefined ? {} : { policy: request.policy }),
    ...(axes === undefined ? {} : { axes }),
    ...(request.addMissingVariables === undefined
      ? {}
      : { add_missing_variables: request.addMissingVariables }),
    ...(request.spm === undefined ? {} : { spm: request.spm }),
  };
}

function refusal(
  answer: ApiV1Answer,
  calculationId: string | null,
  fallbackMessage = `API v1 answered HTTP ${answer.response.status}.`,
): HouseholdCalculationRefusedError {
  const fields = isJsonObject(answer.body) ? answer.body : {};
  const message =
    typeof fields.message === "string" && fields.message.length > 0
      ? fields.message
      : fallbackMessage;
  return new HouseholdCalculationRefusedError(message, {
    statusCode: answer.response.status,
    body: answer.body,
    code: typeof fields.code === "string" ? fields.code : null,
    retryAfterSeconds: retryAfterSeconds(answer.response),
    observabilityId: answer.response.headers.get(OBSERVABILITY_ID_HEADER),
    requestId: answer.response.headers.get(REQUEST_ID_HEADER),
    calculationId,
  });
}

/**
 * An answer that came with a success status but cannot be read. Its own
 * message, if any, is not the reason, so `message` replaces it.
 */
function unreadable(
  answer: ApiV1Answer,
  calculationId: string | null,
  message: string,
): HouseholdCalculationRefusedError {
  return new HouseholdCalculationRefusedError(
    message,
    refusal(answer, calculationId),
  );
}

/** `result.item` of a success answer, when the answer has one. */
function resultItem(body: unknown): JsonObject | undefined {
  const result = isJsonObject(body) ? body.result : undefined;
  const item = isJsonObject(result) ? result.item : undefined;
  return isJsonObject(item) ? item : undefined;
}

/** Whether a body is API v1's own error answer: `{status: "error", message}`. */
function isApiV1ErrorBody(body: unknown): boolean {
  return (
    isJsonObject(body) &&
    body.status === "error" &&
    typeof body.message === "string"
  );
}

/** The accepted calculation in a submission's answer. */
function readSubmitted(answer: ApiV1Answer): SubmittedCalculation {
  const item = resultItem(answer.body);
  const calculationId = item?.calculation_id;
  const status = item?.status;
  if (
    typeof calculationId !== "string" ||
    !CALCULATION_ID_PATTERN.test(calculationId) ||
    !isCalculationStatus(status)
  ) {
    throw unreadable(
      answer,
      null,
      "API v1 accepted the household calculation, but its answer has no calculation ID the helper can read, so the calculation, if one started, cannot be read.",
    );
  }
  return { calculationId, status };
}

type CalculationRead =
  | { readonly status: HouseholdCalculationUnfinishedStatus }
  | { readonly status: "succeeded"; readonly calculated: CalculatedHousehold }
  | {
      readonly status: "failed";
      readonly failure: HouseholdCalculationFailedError;
    };

/** The calculation in a read's answer, or a refusal when it cannot be read. */
function readCalculation(
  answer: ApiV1Answer,
  calculationId: string,
): CalculationRead {
  const cannotRead = () =>
    unreadable(
      answer,
      calculationId,
      `API v1's answer for household calculation ${calculationId} cannot be read.`,
    );
  const item = resultItem(answer.body);
  if (item === undefined || item.calculation_id !== calculationId) {
    throw cannotRead();
  }

  if (item.status === "pending" || item.status === "running") {
    return { status: item.status };
  }

  if (item.status === "succeeded") {
    const result = item.result;
    if (!isJsonObject(result) || !isJsonObject(result.household)) {
      throw cannotRead();
    }
    const warnings = stringsOrUndefined(result.warnings);
    const spmConfig = objectOrNull(result.spm_config);
    const spmProvenance = objectOrNull(result.spm_provenance);
    if (
      warnings === undefined ||
      spmConfig === undefined ||
      spmProvenance === undefined ||
      typeof item.country_package_version !== "string" ||
      typeof item.policyengine_version !== "string"
    ) {
      throw cannotRead();
    }
    return {
      status: "succeeded",
      calculated: {
        calculationId,
        household: result.household,
        warnings,
        spmConfig,
        spmProvenance,
        countryPackageVersion: item.country_package_version,
        policyengineVersion: item.policyengine_version,
      },
    };
  }

  if (item.status === "failed") {
    const error = item.error;
    if (!isJsonObject(error) || typeof error.message !== "string") {
      throw cannotRead();
    }
    const code = error.code ?? null;
    const inputErrors = error.input_errors ?? [];
    const spmError = objectOrNull(error.spm_error);
    if (
      (code !== null && typeof code !== "string") ||
      !Array.isArray(inputErrors) ||
      !inputErrors.every(isJsonObject) ||
      spmError === undefined
    ) {
      throw cannotRead();
    }
    return {
      status: "failed",
      failure: new HouseholdCalculationFailedError(
        error.message,
        calculationId,
        code,
        inputErrors,
        spmError,
      ),
    };
  }

  throw cannotRead();
}

/**
 * A failure of fetchFromServer that sending again cannot repeat: the server
 * credential could not be obtained, so the request was never sent.
 */
function isUnsentCredentialFailure(error: unknown): boolean {
  return (
    error instanceof PublicApiUnavailableError &&
    error.reason === "credential_unavailable"
  );
}

/** Failures of fetchFromServer that a brief outage explains. */
const BRIEF_OUTAGE_REASONS: ReadonlySet<PublicApiUnavailableReason> = new Set([
  "credential_unavailable",
  "unreachable",
  "timed_out",
  "answer_lost",
]);

/**
 * A failure of fetchFromServer that a brief outage explains: the credential
 * could not be obtained, or API v1 could not be reached, did not answer in
 * time, or its answer was lost. An unknown route or a deployment with no
 * API v1 configured is not one.
 */
function isBriefOutage(error: unknown): boolean {
  return (
    error instanceof PublicApiUnavailableError &&
    BRIEF_OUTAGE_REASONS.has(error.reason)
  );
}

export function createHouseholdCalculator(
  dependencies: HouseholdCalculatorDependencies,
): HouseholdCalculator {
  const { forwarder } = dependencies;
  const now = dependencies.now ?? Date.now;
  const wait = dependencies.wait ?? waitWithTimer;

  async function send(
    request: PublicApiRequest,
    signal: AbortSignal | undefined,
    timeoutMilliseconds: number,
  ): Promise<ApiV1Answer> {
    const response = await forwarder.fetchFromServer(request, {
      signal,
      timeoutMilliseconds,
    });
    let text: string;
    try {
      text = await response.text();
    } catch {
      if (signal?.aborted) {
        throw signal.reason;
      }
      // The answer was lost after the request arrived.
      throw new PublicApiUnavailableError(
        "API v1's answer was lost before it could be read.",
        502,
        "answer_lost",
      );
    }
    let body: unknown = null;
    try {
      body = text === "" ? null : JSON.parse(text);
    } catch {
      // Not JSON, such as a load balancer's error page; the status still tells.
    }
    return { response, body };
  }

  /**
   * How long to wait before trying again after a retried answer: its
   * Retry-After for a 429 or 503, but never less than one interval, so
   * that a Retry-After of 0 cannot make the helper send requests back to
   * back.
   */
  function retryWaitMilliseconds(response: Response): number {
    const seconds = RETRY_AFTER_STATUSES.has(response.status)
      ? retryAfterSeconds(response)
      : null;
    return seconds === null
      ? HOUSEHOLD_CALCULATION_POLL_INTERVAL_MILLISECONDS
      : Math.max(
          seconds * 1_000,
          HOUSEHOLD_CALCULATION_POLL_INTERVAL_MILLISECONDS,
        );
  }

  /**
   * Waits before submitting again, and true; or false, without waiting,
   * when the wait would reach the deadline, since a calculation submitted
   * then could not be read.
   */
  async function waitToResubmit(
    milliseconds: number,
    deadline: number,
    signal: AbortSignal | undefined,
  ): Promise<boolean> {
    if (now() + milliseconds >= deadline) {
      return false;
    }
    await wait(Math.min(milliseconds, LONGEST_TIMER_MILLISECONDS), signal);
    return true;
  }

  async function submit(
    request: InlineHouseholdCalculationRequest,
    deadline: number,
    signal: AbortSignal | undefined,
  ): Promise<SubmittedCalculation> {
    const body = JSON.stringify(submissionBody(request));
    const startedAt = now();
    const canRetry = () =>
      now() - startedAt < HOUSEHOLD_CALCULATION_OUTAGE_LIMIT_MILLISECONDS;

    for (;;) {
      signal?.throwIfAborted();
      // A submission may wait for an API v1 instance to start, which can
      // take minutes, so it may take until the deadline (at least the
      // forwarder's usual 30 seconds). Timing it out sooner would leave a
      // job that may exist, which the helper must not submit again.
      // AbortSignal.timeout takes whole milliseconds only.
      const timeoutMilliseconds = Math.ceil(
        Math.min(
          Math.max(
            DEFAULT_SERVER_REQUEST_TIMEOUT_MILLISECONDS,
            deadline - now(),
          ),
          LONGEST_TIMER_MILLISECONDS,
        ),
      );
      let answer: ApiV1Answer;
      try {
        answer = await send(
          { method: "POST", path: SUBMISSION_PATH, body },
          signal,
          timeoutMilliseconds,
        );
      } catch (error) {
        if (
          !isUnsentCredentialFailure(error) ||
          !canRetry() ||
          !(await waitToResubmit(
            HOUSEHOLD_CALCULATION_POLL_INTERVAL_MILLISECONDS,
            deadline,
            signal,
          ))
        ) {
          throw error;
        }
        continue;
      }

      if (answer.response.ok) {
        return readSubmitted(answer);
      }
      const failure = refusal(answer, null);
      if (
        !RETRIED_SUBMISSION_STATUSES.has(answer.response.status) ||
        !isApiV1ErrorBody(answer.body) ||
        !canRetry() ||
        !(await waitToResubmit(
          retryWaitMilliseconds(answer.response),
          deadline,
          signal,
        ))
      ) {
        throw failure;
      }
    }
  }

  async function readUntilFinished(
    submitted: SubmittedCalculation,
    deadline: number,
    signal: AbortSignal | undefined,
  ): Promise<CalculatedHousehold> {
    const { calculationId } = submitted;
    const path = `${SUBMISSION_PATH}/${calculationId}`;
    let lastStatus: HouseholdCalculationStatus = submitted.status;
    let lastGoodAnswerAt = now();
    // A calculation the submission's answer says has finished is read at
    // once, for its result or error.
    let nextWaitMilliseconds =
      submitted.status === "succeeded" || submitted.status === "failed"
        ? 0
        : HOUSEHOLD_CALCULATION_POLL_INTERVAL_MILLISECONDS;
    const outageLimitReached = () =>
      now() - lastGoodAnswerAt >=
      HOUSEHOLD_CALCULATION_OUTAGE_LIMIT_MILLISECONDS;
    const timedOut = () =>
      new HouseholdCalculationTimeoutError(
        `Household calculation ${calculationId} did not finish in time.`,
        calculationId,
        lastStatus,
      );

    // Wait, read, then stop if the deadline has come: so the accepted
    // calculation is read at least once, and the last read happens at the
    // deadline.
    for (;;) {
      const waitMilliseconds = Math.min(
        nextWaitMilliseconds,
        Math.max(deadline - now(), 0),
        LONGEST_TIMER_MILLISECONDS,
      );
      if (waitMilliseconds > 0) {
        await wait(waitMilliseconds, signal);
      }
      signal?.throwIfAborted();
      nextWaitMilliseconds = HOUSEHOLD_CALCULATION_POLL_INTERVAL_MILLISECONDS;

      let answer: ApiV1Answer;
      try {
        answer = await send(
          { method: "GET", path },
          signal,
          DEFAULT_SERVER_REQUEST_TIMEOUT_MILLISECONDS,
        );
      } catch (error) {
        if (!isBriefOutage(error) || outageLimitReached()) {
          throw error;
        }
        if (now() >= deadline) {
          throw timedOut();
        }
        continue;
      }

      if (!answer.response.ok) {
        if (
          !RETRIED_READ_STATUSES.has(answer.response.status) ||
          outageLimitReached()
        ) {
          throw refusal(answer, calculationId);
        }
        if (now() >= deadline) {
          throw timedOut();
        }
        nextWaitMilliseconds = retryWaitMilliseconds(answer.response);
        continue;
      }

      const calculation = readCalculation(answer, calculationId);
      lastGoodAnswerAt = now();
      if (calculation.status === "succeeded") {
        return calculation.calculated;
      }
      if (calculation.status === "failed") {
        throw calculation.failure;
      }
      lastStatus = calculation.status;
      if (now() >= deadline) {
        throw timedOut();
      }
    }
  }

  return {
    async calculateHousehold(request, options = {}) {
      const { signal } = options;
      const timeLimitMilliseconds =
        options.timeLimitMilliseconds ??
        HOUSEHOLD_CALCULATION_TIME_LIMIT_MILLISECONDS;
      // Anything else would make a deadline that never comes, or waits that
      // setTimeout runs at once.
      if (
        typeof timeLimitMilliseconds !== "number" ||
        Number.isNaN(timeLimitMilliseconds) ||
        timeLimitMilliseconds < 0
      ) {
        throw new RangeError(
          `timeLimitMilliseconds must be a number, 0 or more, or Infinity; got ${String(timeLimitMilliseconds)}.`,
        );
      }
      const deadline = now() + timeLimitMilliseconds;
      const submitted = await submit(request, deadline, signal);
      return readUntilFinished(submitted, deadline, signal);
    },
  };
}
