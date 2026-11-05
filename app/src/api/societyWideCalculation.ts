import { normalizeSocietyWideOutput } from '@/adapters/societyWideOutputNormalizer';
import { BASE_URL } from '@/constants';
import { canonicalRegionCode } from '@/models/region';
import type { LocalAreaBreakdown } from '@/types/metadata/LocalAreaBreakdown';
import { ReportOutputSocietyWideUK } from '@/types/metadata/ReportOutputSocietyWideUK';
import { ReportOutputSocietyWideUS } from '@/types/metadata/ReportOutputSocietyWideUS';

export type SocietyWideReportOutput = ReportOutputSocietyWideUS | ReportOutputSocietyWideUK;

export interface PolicyEngineBundle {
  model_version?: string | null;
  policyengine_version?: string | null;
  data_version?: string | null;
  dataset?: string | null;
}

/**
 * A separate run in place of the national results: `local_areas` asks for a
 * UK report's constituency and local authority impacts alone.
 */
export type SocietyWideBreakdown = 'local_areas';

// NOTE: Need to add other params at later point
export interface SocietyWideCalculationParams {
  region: string; // "us" for US nationwide, "state/ca" for US states, or another API v1 region code
  time_period: string; // Four-digit year
}

/**
 * The economy endpoint's query: a national request's parameters, plus a
 * breakdown only for fetchLocalAreaBreakdown, so a breakdown's result is
 * never typed as national results.
 */
interface EconomyCalculationParams extends SocietyWideCalculationParams {
  breakdown?: SocietyWideBreakdown;
}

const SOCIETY_WIDE_QUERY_KEYS: ReadonlyArray<keyof EconomyCalculationParams> = [
  'region',
  'time_period',
  'breakdown',
];

/** The economy endpoint's status envelope around a result. */
export interface EconomyCalculationResponse<Result> {
  status: 'computing' | 'ok' | 'error';
  queue_position?: number;
  average_time?: number;
  result: Result | null;
  error?: string;
  /**
   * A bundle beside the result. The Public API puts the bundle inside the
   * result instead; this one is read only when the result has none.
   */
  policyengine_bundle?: PolicyEngineBundle | null;
  /** Optional stage fields while computing (policyengine-sim-api#781 via the API). */
  stage?: string;
  progress?: number;
  progress_max?: number;
  stage_started_at?: string;
  segments?: { completed: number; total: number };
}

export type SocietyWideCalculationResponse = EconomyCalculationResponse<SocietyWideReportOutput>;

/**
 * A `breakdown=local_areas` run's envelope; its result is keyed by area
 * name. A Public API deployment that ignores the parameter answers with
 * national results instead, so an ok result is either; isLocalAreaBreakdown
 * tells them apart.
 */
export type LocalAreaBreakdownResponse = EconomyCalculationResponse<
  LocalAreaBreakdown | SocietyWideReportOutput
>;

/** Whether a breakdown request's result is a breakdown, not national results. */
export function isLocalAreaBreakdown(
  result: LocalAreaBreakdown | SocietyWideReportOutput
): result is LocalAreaBreakdown {
  return 'kind' in result && result.kind === 'local_areas';
}

/** The version fields a result carries, which the bundle fills in, and the bundle itself. */
interface ResultProvenance {
  model_version?: string | null;
  policyengine_version?: string | null;
  data_version?: string | null;
  dataset?: string | null;
  policyengine_bundle?: PolicyEngineBundle | null;
}

/**
 * Fill a result's version fields and dataset from its policyengine_bundle.
 * The Public API's economy route returns `{ status, message, result }`, with
 * the bundle inside `result`; a bundle beside the result is read only when
 * the result has none. Each field takes the bundle's value, else the
 * result's own.
 */
function mergePolicyEngineBundle<Result extends ResultProvenance>(
  response: EconomyCalculationResponse<Result>
): EconomyCalculationResponse<Result> {
  const bundle = response.result?.policyengine_bundle ?? response.policyengine_bundle;
  if (!response.result || !bundle) {
    return response;
  }

  return {
    ...response,
    result: {
      ...response.result,
      model_version: bundle.model_version ?? response.result.model_version,
      policyengine_version:
        bundle.policyengine_version ?? response.result.policyengine_version ?? null,
      data_version: bundle.data_version ?? response.result.data_version,
      dataset: bundle.dataset ?? response.result.dataset ?? null,
    },
  };
}

export async function fetchSocietyWideCalculation(
  countryId: string,
  reformPolicyId: string,
  baselinePolicyId: string,
  params: SocietyWideCalculationParams
): Promise<SocietyWideCalculationResponse> {
  // Only the national fields: a breakdown goes through fetchLocalAreaBreakdown.
  return fetchEconomyCalculation<SocietyWideReportOutput>(
    countryId,
    reformPolicyId,
    baselinePolicyId,
    { region: params.region, time_period: params.time_period },
    NATIONAL_REQUEST
  );
}

/**
 * A UK report's local-area breakdown: the same economy endpoint and
 * policies, for the report's region (`uk` or `country/*`) and year, with
 * `breakdown=local_areas`. Poll it as the national run is polled.
 */
export async function fetchLocalAreaBreakdown(
  countryId: string,
  reformPolicyId: string,
  baselinePolicyId: string,
  params: SocietyWideCalculationParams
): Promise<LocalAreaBreakdownResponse> {
  return fetchEconomyCalculation<LocalAreaBreakdown | SocietyWideReportOutput>(
    countryId,
    reformPolicyId,
    baselinePolicyId,
    { region: params.region, time_period: params.time_period, breakdown: 'local_areas' },
    BREAKDOWN_REQUEST
  );
}

/** How a request names itself in its errors and logs. */
interface EconomyRequestKind {
  /** The start of an error's message, e.g. "Local-area breakdown failed". */
  label: string;
  /** The log entry's prefix, the calling function's name. */
  logName: string;
  /** Give the error body's `message` field, when it has one, rather than the raw body. */
  readsBodyMessage: boolean;
}

const NATIONAL_REQUEST: EconomyRequestKind = {
  label: 'Society-wide calculation',
  logName: 'fetchSocietyWideCalculation',
  readsBodyMessage: false,
};

const BREAKDOWN_REQUEST: EconomyRequestKind = {
  label: 'Local-area breakdown',
  logName: 'fetchLocalAreaBreakdown',
  readsBodyMessage: true,
};

/**
 * A non-ok answer from the economy endpoint, to a GET or a DELETE. The
 * message names the request ("Society-wide calculation failed (502): …",
 * as it always has, or "Economy DELETE failed (409): …"), for people and
 * logs; code reads the HTTP status and the parsed body instead.
 */
export class EconomyCalculationError extends Error {
  /** The answer's HTTP status. */
  readonly status: number;
  /** The answer's body parsed as JSON, or null when it is not JSON. */
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'EconomyCalculationError';
    this.status = status;
    this.body = body;
  }
}

/** A calculation the Public API ran and that failed, as its 502 answer says. */
export interface FailedCalculation {
  /**
   * How long the Public API keeps answering with this failure, in seconds;
   * after that a request starts a new run. Null when it does not say.
   */
  retryAfterSeconds: number | null;
  /**
   * In how many seconds the Public API will accept a DELETE of this stored
   * failure (deleteFailedSocietyWideCalculation); 0 once it will. Null when
   * the answer does not say: a deploy from before the DELETE, or no failure
   * stored for the next request to answer with.
   */
  deleteAfterSeconds: number | null;
}

/** A body field read as whole or fractional seconds, or null when it is not a usable number. */
function secondsField(body: object, field: string): number | null {
  const seconds = (body as Record<string, unknown>)[field];
  return typeof seconds === 'number' && Number.isFinite(seconds) && seconds >= 0 ? seconds : null;
}

/** Whether a parsed body is the Public API's error envelope, `{ status: "error", … }`. */
function isErrorBody(body: unknown): body is object {
  return (
    !!body &&
    typeof body === 'object' &&
    !Array.isArray(body) &&
    (body as { status?: unknown }).status === 'error'
  );
}

/**
 * Whether an economy request's error is a failed calculation: the Public API
 * answers one with 502 and `{ status: "error", message, result: null,
 * retry_after_seconds, delete_after_seconds }`. Null for anything else, such
 * as a proxy's 502 page, another status or a network error, which are failed
 * requests instead. Only for an economy GET's error: a DELETE's error is the
 * same class, but a 502 from it is not a failed calculation.
 */
export function failedCalculationOf(error: unknown): FailedCalculation | null {
  if (!(error instanceof EconomyCalculationError) || error.status !== 502) {
    return null;
  }
  const body = error.body;
  if (!isErrorBody(body)) {
    return null;
  }
  return {
    retryAfterSeconds: secondsField(body, 'retry_after_seconds'),
    deleteAfterSeconds: secondsField(body, 'delete_after_seconds'),
  };
}

/** What the Public API did with a DELETE of a stored economy failure. */
export type StoredFailureDeletion =
  /** 204: the failure was removed, so the next economy request submits a new run. */
  | { outcome: 'deleted' }
  /** 404: nothing was stored (never run, or expired), so the next request submits a new run. */
  | { outcome: 'nothing-stored' }
  /** 409: the failure is less than 10 seconds old; a DELETE is accepted in this many seconds. */
  | { outcome: 'too-soon'; deleteAfterSeconds: number }
  /** 409: the stored result is not a failure: it is computing or ok. */
  | { outcome: 'not-a-failure' };

const DELETE_REQUEST: EconomyRequestKind = {
  label: 'Economy DELETE',
  logName: 'deleteFailedSocietyWideCalculation',
  readsBodyMessage: false,
};

/**
 * Asks the Public API to delete the stored failure that the national
 * economy request (fetchSocietyWideCalculation) with the same arguments
 * answers with, so the next such request submits a new run. It sends DELETE
 * to that request's own URL, and reads the answer's status and
 * `delete_after_seconds`, never its message. Any other answer throws an
 * EconomyCalculationError; a network error propagates.
 */
export async function deleteFailedSocietyWideCalculation(
  countryId: string,
  reformPolicyId: string,
  baselinePolicyId: string,
  params: SocietyWideCalculationParams
): Promise<StoredFailureDeletion> {
  const url = economyUrl(countryId, reformPolicyId, baselinePolicyId, {
    region: params.region,
    time_period: params.time_period,
  });
  const response = await fetch(url, { method: 'DELETE' });
  if (response.status === 204) {
    return { outcome: 'deleted' };
  }

  const body = await responseText(response);
  const parsed = parsedBody(body);
  if (response.status === 404 && isErrorBody(parsed)) {
    return { outcome: 'nothing-stored' };
  }
  if (response.status === 409 && isErrorBody(parsed) && 'delete_after_seconds' in parsed) {
    if (parsed.delete_after_seconds === null) {
      return { outcome: 'not-a-failure' };
    }
    const seconds = secondsField(parsed, 'delete_after_seconds');
    if (seconds !== null) {
      return { outcome: 'too-soon', deleteAfterSeconds: seconds };
    }
  }
  throw economyRequestError(response, url, body, parsed, DELETE_REQUEST);
}

/** A body parsed as JSON, or null when it is not JSON. */
function parsedBody(body: string): unknown {
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

/** An error body's `message` field, when the body is JSON with one. */
function bodyMessage(parsed: unknown): string | null {
  if (parsed && typeof parsed === 'object') {
    const message = (parsed as { message?: unknown }).message;
    return typeof message === 'string' && message ? message : null;
  }
  return null;
}

/** The economy endpoint's URL for a policy pair and query; a GET and a DELETE share it. */
function economyUrl(
  countryId: string,
  reformPolicyId: string,
  baselinePolicyId: string,
  params: EconomyCalculationParams
): string {
  const queryParams = new URLSearchParams();

  // The region the app uses: a report saved for "country/ni" asks for "country/northern_ireland".
  const requestParams =
    typeof params.region === 'string'
      ? { ...params, region: canonicalRegionCode(params.region) }
      : params;
  SOCIETY_WIDE_QUERY_KEYS.forEach((key) => {
    const value = requestParams[key];
    if (value !== undefined) {
      queryParams.append(key, String(value));
    }
  });

  const queryString = queryParams.toString();
  return `${BASE_URL}/${countryId}/economy/${reformPolicyId}/over/${baselinePolicyId}${queryString ? `?${queryString}` : ''}`;
}

/** A response's body as text, or empty when it cannot be read. */
async function responseText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return '';
  }
}

/** Logs a non-ok economy answer and gives the error to throw for it. */
function economyRequestError(
  response: Response,
  url: string,
  body: string,
  parsed: unknown,
  kind: EconomyRequestKind
): EconomyCalculationError {
  console.error(`[${kind.logName}] ${response.status} ${response.statusText}`, url, body);
  const detail = (kind.readsBodyMessage && bodyMessage(parsed)) || body || response.statusText;
  return new EconomyCalculationError(
    `${kind.label} failed (${response.status}): ${detail}`,
    response.status,
    parsed
  );
}

async function fetchEconomyCalculation<Result extends ResultProvenance>(
  countryId: string,
  reformPolicyId: string,
  baselinePolicyId: string,
  params: EconomyCalculationParams,
  kind: EconomyRequestKind
): Promise<EconomyCalculationResponse<Result>> {
  const url = economyUrl(countryId, reformPolicyId, baselinePolicyId, params);

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const body = await responseText(response);
    throw economyRequestError(response, url, body, parsedBody(body), kind);
  }

  const data: EconomyCalculationResponse<Result> = await response.json();
  // UK geography impacts arrive as lists of areas; the app reads them keyed by name.
  return mergePolicyEngineBundle({ ...data, result: normalizeSocietyWideOutput(data.result) });
}
