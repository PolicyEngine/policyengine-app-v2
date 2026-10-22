import { normalizeSocietyWideOutput } from '@/adapters/societyWideOutputNormalizer';
import { BASE_URL } from '@/constants';
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
  policyengine_bundle?: PolicyEngineBundle | null;
  /** Optional stage fields while computing (policyengine-sim-api#781 via the API). */
  stage?: string;
  progress?: number;
  progress_max?: number;
  stage_started_at?: string;
  segments?: { completed: number; total: number };
}

export type SocietyWideCalculationResponse = EconomyCalculationResponse<SocietyWideReportOutput>;

/** A `breakdown=local_areas` run's envelope; its result is keyed by area name. */
export type LocalAreaBreakdownResponse = EconomyCalculationResponse<LocalAreaBreakdown>;

/** The version fields a result carries, which the bundle fills in. */
interface ResultProvenance {
  model_version?: string | null;
  policyengine_version?: string | null;
  data_version?: string | null;
  dataset?: string | null;
}

function mergePolicyEngineBundle<Result extends ResultProvenance>(
  response: EconomyCalculationResponse<Result>
): EconomyCalculationResponse<Result> {
  if (!response.result || !response.policyengine_bundle) {
    return response;
  }

  const { policyengine_bundle: bundle } = response;

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
  return fetchEconomyCalculation<LocalAreaBreakdown>(
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

/** An error body's `message` field, when the body is JSON with one. */
function bodyMessage(body: string): string | null {
  try {
    const parsed: unknown = JSON.parse(body);
    if (parsed && typeof parsed === 'object') {
      const message = (parsed as { message?: unknown }).message;
      return typeof message === 'string' && message ? message : null;
    }
  } catch {
    // Not JSON: the caller gives the body as it is.
  }
  return null;
}

async function fetchEconomyCalculation<Result extends ResultProvenance>(
  countryId: string,
  reformPolicyId: string,
  baselinePolicyId: string,
  params: EconomyCalculationParams,
  kind: EconomyRequestKind
): Promise<EconomyCalculationResponse<Result>> {
  const queryParams = new URLSearchParams();

  SOCIETY_WIDE_QUERY_KEYS.forEach((key) => {
    const value = params[key];
    if (value !== undefined) {
      queryParams.append(key, String(value));
    }
  });

  const queryString = queryParams.toString();
  const url = `${BASE_URL}/${countryId}/economy/${reformPolicyId}/over/${baselinePolicyId}${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    let body = '';
    try {
      body = await response.text();
    } catch {
      // ignore
    }
    console.error(`[${kind.logName}] ${response.status} ${response.statusText}`, url, body);
    const detail = (kind.readsBodyMessage && bodyMessage(body)) || body || response.statusText;
    throw new Error(`${kind.label} failed (${response.status}): ${detail}`);
  }

  const data: EconomyCalculationResponse<Result> = await response.json();
  // UK geography impacts arrive as lists of areas; the app reads them keyed by name.
  return mergePolicyEngineBundle({ ...data, result: normalizeSocietyWideOutput(data.result) });
}
