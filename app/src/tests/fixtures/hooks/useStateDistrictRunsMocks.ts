import { vi } from 'vitest';
import type {
  EconomyCalculationResponse,
  SocietyWideReportOutput,
} from '@/api/societyWideCalculation';
import { BASE_URL } from '@/constants';
import type { Region } from '@/models/region';
import { requestUrlOf } from '@/tests/fixtures/api/publicApiRouteMocks';
import {
  DELETE_NOT_A_FAILURE_BODY,
  DELETE_NOTHING_STORED_BODY,
  DELETE_REFUSED_SECONDS,
  DELETE_TOO_SOON_BODY,
} from '@/tests/fixtures/api/societyWideMocks';
import {
  CONGRESSIONAL_DISTRICTS_GEOJSON_PATH,
  MOCK_GEOJSON_FEATURE_COLLECTION,
} from '@/tests/fixtures/components/visualization/usDistrictChoroplethMapMocks';
import { ALL_US_STATE_CODES } from '@/tests/fixtures/contexts/congressional-district/congressionalDistrictMocks';
import { createMockSocietyWideOutput } from '@/tests/fixtures/pages/reportOutputMocks';
import type { ReportMetadata } from '@/types/metadata/reportMetadata';
import type { USCongressionalDistrictBreakdownItem } from '@/types/metadata/ReportOutputSocietyWideByCongressionalDistrict';
import { US_REGION_TYPES } from '@/types/regionTypes';

export const STATE_RUNS_REFORM_POLICY_ID = '88001';
export const STATE_RUNS_BASELINE_POLICY_ID = '2';
export const STATE_RUNS_YEAR = '2026';
/** Another year of the same report's budget window. */
export const OTHER_STATE_RUNS_YEAR = '2027';

/** A nationwide report's policies and year, as the state district runs take them. */
export const STATE_RUNS_REQUEST = {
  reformPolicyId: STATE_RUNS_REFORM_POLICY_ID,
  baselinePolicyId: STATE_RUNS_BASELINE_POLICY_ID,
  year: STATE_RUNS_YEAR,
};

export const UTAH = 'state/ut';
export const CALIFORNIA = 'state/ca';
export const TEXAS = 'state/tx';
export const OHIO = 'state/oh';

/** How many states (with DC) a nationwide report runs. */
export const STATE_COUNT = ALL_US_STATE_CODES.length;

/** Three requests per state: two simulations and the base report. */
export const RECORD_REQUESTS_PER_STATE = 3;

/** The most requests the runs may have in flight at once. */
export const MAX_REQUESTS_IN_FLIGHT = 4;

const STATE_NAMES: Record<string, string> = {
  'state/al': 'Alabama',
  'state/ak': 'Alaska',
  'state/az': 'Arizona',
  'state/ar': 'Arkansas',
  'state/ca': 'California',
  'state/co': 'Colorado',
  'state/ct': 'Connecticut',
  'state/de': 'Delaware',
  'state/dc': 'District of Columbia',
  'state/fl': 'Florida',
  'state/ga': 'Georgia',
  'state/hi': 'Hawaii',
  'state/id': 'Idaho',
  'state/il': 'Illinois',
  'state/in': 'Indiana',
  'state/ia': 'Iowa',
  'state/ks': 'Kansas',
  'state/ky': 'Kentucky',
  'state/la': 'Louisiana',
  'state/me': 'Maine',
  'state/md': 'Maryland',
  'state/ma': 'Massachusetts',
  'state/mi': 'Michigan',
  'state/mn': 'Minnesota',
  'state/ms': 'Mississippi',
  'state/mo': 'Missouri',
  'state/mt': 'Montana',
  'state/ne': 'Nebraska',
  'state/nv': 'Nevada',
  'state/nh': 'New Hampshire',
  'state/nj': 'New Jersey',
  'state/nm': 'New Mexico',
  'state/ny': 'New York',
  'state/nc': 'North Carolina',
  'state/nd': 'North Dakota',
  'state/oh': 'Ohio',
  'state/ok': 'Oklahoma',
  'state/or': 'Oregon',
  'state/pa': 'Pennsylvania',
  'state/ri': 'Rhode Island',
  'state/sc': 'South Carolina',
  'state/sd': 'South Dakota',
  'state/tn': 'Tennessee',
  'state/tx': 'Texas',
  'state/ut': 'Utah',
  'state/vt': 'Vermont',
  'state/va': 'Virginia',
  'state/wa': 'Washington',
  'state/wv': 'West Virginia',
  'state/wi': 'Wisconsin',
  'state/wy': 'Wyoming',
};

/** A state's name, as the region metadata labels it. */
export function stateName(region: string): string {
  return STATE_NAMES[region];
}

/** The region metadata's 50 states and DC, with the country itself. */
export const US_STATE_REGIONS: Region[] = [
  {
    id: 'region-us',
    countryId: 'us',
    code: 'us',
    label: 'the US',
    regionType: US_REGION_TYPES.NATIONAL,
    parentCode: null,
    filterField: null,
    filterValue: null,
    filterStrategy: null,
    requiresFilter: false,
    stateCode: null,
    stateName: null,
  },
  ...ALL_US_STATE_CODES.map(
    (code): Region => ({
      id: `region-${code}`,
      countryId: 'us',
      code,
      label: STATE_NAMES[code],
      regionType: US_REGION_TYPES.STATE,
      parentCode: 'us',
      filterField: null,
      filterValue: null,
      filterStrategy: null,
      requiresFilter: false,
      stateCode: code.slice('state/'.length).toUpperCase(),
      stateName: STATE_NAMES[code],
    })
  ),
];

/** A state's two districts, as its own run returns them (Wyoming's one as WY-00). */
export function stateDistricts(region: string): USCongressionalDistrictBreakdownItem[] {
  const abbreviation = region.slice('state/'.length).toUpperCase();
  const index = ALL_US_STATE_CODES.indexOf(region);
  if (abbreviation === 'WY') {
    return [
      {
        district: 'WY-00',
        average_household_income_change: 500,
        relative_household_income_change: 0.03,
      },
    ];
  }
  return [1, 2].map((number) => ({
    district: `${abbreviation}-0${number}`,
    average_household_income_change: 100 + index * 10 + number,
    relative_household_income_change: 0.001 * (index + number),
  }));
}

/** A state's districts once the app has normalised their IDs. */
export function normalizedStateDistricts(region: string): USCongressionalDistrictBreakdownItem[] {
  return stateDistricts(region).map((district) => ({
    ...district,
    district: district.district === 'WY-00' ? 'WY-01' : district.district,
  }));
}

/** A state's full result from its run, with its districts. */
export function stateResult(
  region: string,
  districts: USCongressionalDistrictBreakdownItem[] | null = stateDistricts(region)
): SocietyWideReportOutput {
  return createMockSocietyWideOutput({
    congressional_district_impact: districts ? { districts } : null,
  }) as SocietyWideReportOutput;
}

/** How a state's base report stands on the Public API when the view opens. */
export interface StoredStateReport {
  status: ReportMetadata['status'];
  /** The result stored on it, when complete. */
  output?: SocietyWideReportOutput | null;
}

export const stateReportComplete = (region: string): StoredStateReport => ({
  status: 'complete',
  output: stateResult(region),
});
export const stateReportCompleteWithoutDistricts = (region: string): StoredStateReport => ({
  status: 'complete',
  output: stateResult(region, null),
});
export const stateReportCompleteWithUnreadableDistricts = (region: string): StoredStateReport => ({
  status: 'complete',
  output: {
    ...stateResult(region),
    congressional_district_impact: { districts: 'unreadable' },
  } as unknown as SocietyWideReportOutput,
});
export const STATE_REPORT_PENDING: StoredStateReport = { status: 'pending' };
export const STATE_REPORT_ERROR: StoredStateReport = { status: 'error' };

/** A state's economy response for one poll. */
export type StateEconomyResponse =
  | EconomyCalculationResponse<SocietyWideReportOutput>
  | Error
  | Response;

export const STATE_COMPUTING: StateEconomyResponse = {
  status: 'computing',
  queue_position: 0,
  result: null,
};

export const stateOk = (region: string): StateEconomyResponse => ({
  status: 'ok',
  result: stateResult(region),
});

export const stateOkWithoutDistricts = (region: string): StateEconomyResponse => ({
  status: 'ok',
  result: stateResult(region, null),
});

/** The Public API's message for a state whose calculation failed, as its 502 body gives it. */
export const STATE_ERROR_MESSAGE =
  'Simulation entrypoint execution failed: Simulation failed (correlation_id=state-run-1)';
/** The reason the app gives for such a failure, the same for every state that failed alike. */
export const STATE_FAILURE_REASON = 'The simulation did not finish';

/**
 * The Public API's answer for a calculation that failed: 502 with an error
 * body, whose `retry_after_seconds` says how long it keeps returning the
 * failure (null when it cannot say), and whose `delete_after_seconds` says
 * in how many seconds a DELETE of it will be accepted. Without
 * `deleteAfterSeconds` the body has no such field, as from a deploy from
 * before the DELETE.
 */
export function stateFailure(
  message: string = STATE_ERROR_MESSAGE,
  retryAfterSeconds: number | null = null,
  deleteAfterSeconds?: number | null
): Response {
  return new Response(
    JSON.stringify({
      status: 'error',
      message,
      result: null,
      retry_after_seconds: retryAfterSeconds,
      ...(deleteAfterSeconds === undefined ? {} : { delete_after_seconds: deleteAfterSeconds }),
    }),
    { status: 502, headers: { 'Content-Type': 'application/json' } }
  );
}
export const STATE_ERROR: StateEconomyResponse = stateFailure();

/** The note the Public API ends a failed state run's message with, for people to read. */
export const STATE_RETRY_NOTE =
  'A new run for this state can be requested 2 minutes after this failure.';
/** How long the Public API keeps a failed state run's error before it runs the state again. */
export const STATE_RETRY_WAIT_SECONDS = 120;
export const STATE_RETRY_WAIT_MS = STATE_RETRY_WAIT_SECONDS * 1000;
/** A failed state run as the Public API answers it: the note, and the seconds it keeps the failure. */
export const stateFailureKeptTwoMinutes = (): Response =>
  stateFailure(`${STATE_ERROR_MESSAGE}. ${STATE_RETRY_NOTE}`, STATE_RETRY_WAIT_SECONDS);
/**
 * The reason the app gives while a failure the Public API keeps has up to 15
 * minutes left, however long exactly, so states that failed alike share it.
 */
export const STATE_RETRY_WAIT_REASON =
  'The simulation did not finish. Retry can start a new run in a few minutes';
/** The reason the app gives while such a failure has longer left, such as 30 days. */
export const STATE_LONG_RETRY_WAIT_REASON =
  "The simulation did not finish. Retry can't start a new run for hours or days";
/** The most seconds left for which the reason says "in a few minutes". */
export const STATE_SHORT_RETRY_WAIT_LIMIT_SECONDS = 15 * 60;
/** Seconds past those 15 minutes that a failure is kept, to see the reason change at 15 minutes. */
export const STATE_PAST_SHORT_RETRY_WAIT_SECONDS = 30;
/** Milliseconds in a second, for moving the fake clock by the Public API's seconds. */
export const MS_PER_SECOND = 1000;
/** The seconds a replayed two-minute failure has left, 30 seconds after it was stored. */
export const STATE_REPLAYED_RETRY_WAIT_SECONDS = 90;
/** The seconds a replayed two-minute failure has left in its last minute. */
export const STATE_LAST_MINUTE_RETRY_WAIT_SECONDS = 50;
/** A failure stored before the Public API kept state failures briefly: kept 30 days. */
export const STATE_STORED_FAILURE_SECONDS = 30 * 24 * 60 * 60;
/** The longest delay a browser timer keeps, 2^31 − 1 ms; it runs a longer one at once. */
export const BROWSER_TIMER_LIMIT_MS = 2 ** 31 - 1;

/** The Public API's lockout: a DELETE is accepted 10 seconds after the failure was recorded. */
export const STATE_DELETE_LOCKOUT_SECONDS = 10;

/**
 * A failed state run as a Public API with the DELETE answers it: kept 2
 * minutes, and deletable in `deleteAfterSeconds` (0: now).
 */
export const stateFailureDeletable = (deleteAfterSeconds = 0): Response =>
  stateFailure(STATE_ERROR_MESSAGE, STATE_RETRY_WAIT_SECONDS, deleteAfterSeconds);

/** The reason the app gives while a DELETE of a state's failure is not accepted yet. */
export const STATE_DELETE_WAIT_REASON =
  'The simulation did not finish. Retry can start a new run in under a minute';

/** The seconds a refused DELETE says are left before the Public API will accept one. */
export const STATE_DELETE_REFUSED_SECONDS = DELETE_REFUSED_SECONDS;

/** A DELETE's answer for a state: an answer, or an error the request throws. */
export type StateDeleteResponse = Response | Error;

/** 204: the Public API removed the state's stored failure. */
export const stateFailureDeleted = (): Response => new Response(null, { status: 204 });

/** 404: the Public API had nothing stored for the state. */
export const stateNothingStored = (): Response =>
  Response.json(DELETE_NOTHING_STORED_BODY, { status: 404 });

/** 409: the state's failure is too new to delete; a DELETE is accepted in `seconds`. */
export const stateDeleteTooSoon = (seconds = STATE_DELETE_REFUSED_SECONDS): Response =>
  Response.json({ ...DELETE_TOO_SOON_BODY, delete_after_seconds: seconds }, { status: 409 });

/** 409: the state's stored result is not a failure, because a newer run is computing or done. */
export const stateDeleteNotAFailure = (): Response =>
  Response.json(DELETE_NOT_A_FAILURE_BODY, { status: 409 });

/** 405: a Public API instance without the DELETE refuses it. */
export const stateDeleteMethodNotAllowed = (): Response =>
  new Response('Method Not Allowed', { status: 405 });

/** 502: the Public API's error envelope when it cannot reach the simulation service. */
export const stateDeleteUnavailable = (): Response =>
  Response.json(
    { status: 'error', message: 'The simulation service could not be reached.', result: null },
    { status: 502 }
  );

/** A DELETE that fails on the network, as the browser's fetch throws it. */
export const stateDeleteNetworkFailure = (): Error => new TypeError('Failed to fetch');

/**
 * A failed state run the Public API no longer keeps (its stored index has
 * expired): 0 seconds left, and a DELETE accepted now.
 */
export const stateFailureNoLongerKept = (): Response => stateFailure(STATE_ERROR_MESSAGE, 0, 0);

/** The reason the app gives when the DELETE finds a newer run in place of the failure. */
export const STATE_NEWER_RUN_REASON = "A newer run is on PolicyEngine's servers. Retry to check it";

/** An error page in place of the Public API's answer, as a proxy or Cloud Run sends one. */
export const stateErrorPage = (): Response =>
  new Response(
    '<html><head><title>503 Service Unavailable</title></head><body><h1>Error: Service Unavailable</h1></body></html>',
    { status: 503, headers: { 'Content-Type': 'text/html' } }
  );
/** The reason the app gives for a state whose request itself failed. */
export const STATE_REQUEST_FAILURE_REASON = "The request to PolicyEngine's servers failed";
/** The reason the app gives for a state whose records could not be looked up. */
export const STATE_RECORDS_FAILURE_REASON = 'Checking for a saved result failed';

/**
 * Failed state runs whose answer lets no DELETE clear them, each with the
 * milliseconds before Retry is offered: from a deploy from before the
 * DELETE (no delete_after_seconds), and with no failure kept (null).
 */
export const STATE_FAILURES_WITHOUT_DELETE: Array<[string, () => Response, number]> = [
  [
    'without delete_after_seconds, as from a deploy from before the DELETE',
    stateFailureKeptTwoMinutes,
    STATE_RETRY_WAIT_MS,
  ],
  [
    'with delete_after_seconds null, as when no failure is kept',
    () => stateFailure(STATE_ERROR_MESSAGE, null, null),
    0,
  ],
];

/** DELETEs of a state's stored failure that fail, as the request answers or throws. */
export const FAILED_STATE_DELETES: Array<[string, () => StateDeleteResponse]> = [
  ['answered with an error page', stateErrorPage],
  ['answered with the Public API’s 502 error body', stateDeleteUnavailable],
  ['refused by a deploy without the DELETE', stateDeleteMethodNotAllowed],
  ['failed on the network', stateDeleteNetworkFailure],
];

/** A state's result whose districts are not a list, so they cannot be read. */
export const stateOkWithUnreadableDistricts = (region: string): StateEconomyResponse => ({
  status: 'ok',
  result: {
    ...stateResult(region),
    congressional_district_impact: { districts: 'unreadable' },
  } as unknown as SocietyWideReportOutput,
});

export const POLL_FAILURE = new Error('Society-wide calculation failed (502): Bad Gateway');

/** One request the fake API received. */
export interface RecordedRequest {
  method: string;
  url: string;
  body: any;
}

export interface FakeStateApiOptions {
  /** How each state's base report stands when looked up; pending when not given. */
  reports?: Record<string, StoredStateReport>;
  /**
   * Each state's economy response to its nth request (from 0); computing when
   * not given.
   */
  economy?: (region: string, request: number) => StateEconomyResponse;
  /** Record requests that fail, by state. */
  failingRecords?: string[];
  /** Holds every economy response until `releaseEconomy()`. */
  holdEconomy?: boolean;
  /**
   * Each state's answer to its nth DELETE of its stored failure (from 0);
   * 204 when not given.
   */
  deleteFailure?: (region: string, request: number) => StateDeleteResponse;
}

export interface FakeStateApi {
  fetch: ReturnType<typeof vi.fn>;
  requests: () => RecordedRequest[];
  /** The economy requests' URLs, in order, whatever their method. */
  economyRequests: () => string[];
  /** The economy requests' URLs for one state, whatever their method. */
  economyRequestsFor: (region: string) => string[];
  /** The DELETEs of one state's stored failure, by URL. */
  deleteRequestsFor: (region: string) => string[];
  /** The methods of one state's requests to the economy URL, in order: GET or DELETE. */
  economyMethodsFor: (region: string) => string[];
  simulationRequests: () => RecordedRequest[];
  reportRequests: () => RecordedRequest[];
  /** The base report writes (PATCH /us/report), in order. */
  reportWrites: () => RecordedRequest[];
  /** The base report ID the Public API gives a state. */
  reportIdFor: (region: string) => number;
  /** The simulation ID the Public API gives a state's baseline or reform. */
  simulationIdFor: (region: string, policy: 'baseline' | 'reform') => number;
  /** The most requests in flight at once so far. */
  maxInFlight: () => number;
  /** Lets record requests fail, or succeed again, by state. */
  setFailingRecords: (regions: string[]) => void;
  /** Holds every economy (GET) response from now until `releaseEconomy()`. */
  holdEconomy: () => void;
  /** Sends the economy responses held so far, and holds no more. */
  releaseEconomy: () => void;
  /** Holds every DELETE's answer until `releaseDeletes()`. */
  holdDeletes: () => void;
  /** Sends the DELETE answers held so far, and holds no more. */
  releaseDeletes: () => void;
  /** Holds these states' simulation requests until `releaseRecords()`. */
  holdRecords: (regions: string[]) => void;
  /** Sends the simulation responses held so far, and holds no more. */
  releaseRecords: () => void;
}

function ok(result: unknown): Response {
  return Response.json({ status: 'ok', message: null, result });
}

/**
 * The Public API as the state district runs use it: simulations and base reports
 * created or reused per state, the economy endpoint per state, and base
 * report writes. It also serves the district map's boundaries, from the map
 * test's GeoJSON fixture. Each request settles a few ticks after it is sent, so
 * the requests in flight can be counted.
 */
export function fakeStateDistrictApi(options: FakeStateApiOptions = {}): FakeStateApi {
  const requests: RecordedRequest[] = [];
  const economyCalls = new Map<string, number>();
  const deleteCalls = new Map<string, number>();
  const simulationRegions = new Map<number, string>();
  let failingRecords = new Set(options.failingRecords ?? []);
  let inFlight = 0;
  let maxInFlight = 0;
  let holdEconomy = options.holdEconomy ?? false;
  let heldRecordStates = new Set<string>();
  const heldRecords: Array<() => void> = [];
  const heldEconomy: Array<() => void> = [];
  let holdDeletes = false;
  const heldDeletes: Array<() => void> = [];

  const reportIdFor = (region: string) => 5000 + ALL_US_STATE_CODES.indexOf(region);
  const simulationIdFor = (region: string, policy: 'baseline' | 'reform') =>
    1000 + ALL_US_STATE_CODES.indexOf(region) * 10 + (policy === 'baseline' ? 1 : 2);

  const respond = async (method: string, url: string, body: any): Promise<Response> => {
    if (url.startsWith(`${BASE_URL}/us/simulation`) && method === 'POST') {
      if (heldRecordStates.has(body.population_id)) {
        await new Promise<void>((release) => heldRecords.push(release));
      }
      if (failingRecords.has(body.population_id)) {
        return new Response('Service unavailable', { status: 503 });
      }
      const simulationId = simulationIdFor(
        body.population_id,
        String(body.policy_id) === STATE_RUNS_BASELINE_POLICY_ID ? 'baseline' : 'reform'
      );
      simulationRegions.set(simulationId, body.population_id);
      return ok({ id: simulationId });
    }
    if (url === `${BASE_URL}/us/report` && method === 'POST') {
      const region = simulationRegions.get(body.simulation_1_id)!;
      const stored = options.reports?.[region] ?? STATE_REPORT_PENDING;
      const report: ReportMetadata = {
        id: reportIdFor(region),
        country_id: 'us',
        simulation_1_id: String(body.simulation_1_id),
        simulation_2_id: String(body.simulation_2_id),
        year: body.year,
        api_version: '1.0.0',
        status: stored.status,
        output: stored.output ? JSON.stringify(stored.output) : null,
      };
      return ok(report);
    }
    if (url === `${BASE_URL}/us/report` && method === 'PATCH') {
      return ok({ id: body.id, status: body.status });
    }
    if (url.includes('/us/economy/') && method === 'DELETE') {
      if (holdDeletes) {
        await new Promise<void>((release) => heldDeletes.push(release));
      }
      const region = requestUrlOf(url).searchParams.get('region')!;
      const call = deleteCalls.get(region) ?? 0;
      deleteCalls.set(region, call + 1);
      const response = options.deleteFailure?.(region, call) ?? stateFailureDeleted();
      if (response instanceof Error) {
        throw response;
      }
      return response.clone();
    }
    if (url.includes('/us/economy/')) {
      if (holdEconomy) {
        await new Promise<void>((release) => heldEconomy.push(release));
      }
      const region = requestUrlOf(url).searchParams.get('region')!;
      const call = economyCalls.get(region) ?? 0;
      economyCalls.set(region, call + 1);
      const response = options.economy?.(region, call) ?? STATE_COMPUTING;
      if (response instanceof Error) {
        throw response;
      }
      if (response instanceof Response) {
        return response.clone();
      }
      return Response.json(response);
    }
    if (url === CONGRESSIONAL_DISTRICTS_GEOJSON_PATH) {
      return Response.json(MOCK_GEOJSON_FEATURE_COLLECTION);
    }
    return new Response('Not found', { status: 404 });
  };

  const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    const body = init?.body ? JSON.parse(String(init.body)) : null;
    requests.push({ method, url, body });
    inFlight += 1;
    maxInFlight = Math.max(maxInFlight, inFlight);
    try {
      // Settle a few ticks later, as a real request would.
      for (let tick = 0; tick < 3; tick++) {
        await Promise.resolve();
      }
      return await respond(method, url, body);
    } finally {
      inFlight -= 1;
    }
  });

  const isEconomyRequest = (request: RecordedRequest) => request.url.includes('/economy/');
  const isFor = (region: string) => (request: RecordedRequest) =>
    isEconomyRequest(request) && requestUrlOf(request.url).searchParams.get('region') === region;

  return {
    fetch,
    requests: () => requests,
    economyRequests: () => requests.filter(isEconomyRequest).map((request) => request.url),
    economyRequestsFor: (region) => requests.filter(isFor(region)).map((request) => request.url),
    deleteRequestsFor: (region) =>
      requests
        .filter((request) => isFor(region)(request) && request.method === 'DELETE')
        .map((request) => request.url),
    economyMethodsFor: (region) => requests.filter(isFor(region)).map((request) => request.method),
    simulationRequests: () =>
      requests.filter((request) => request.url === `${BASE_URL}/us/simulation`),
    reportRequests: () =>
      requests.filter(
        (request) => request.url === `${BASE_URL}/us/report` && request.method === 'POST'
      ),
    reportWrites: () =>
      requests.filter(
        (request) => request.url === `${BASE_URL}/us/report` && request.method === 'PATCH'
      ),
    reportIdFor,
    simulationIdFor,
    maxInFlight: () => maxInFlight,
    setFailingRecords: (regions) => {
      failingRecords = new Set(regions);
    },
    holdRecords: (regions) => {
      heldRecordStates = new Set(regions);
    },
    releaseRecords: () => {
      heldRecordStates = new Set();
      heldRecords.splice(0).forEach((release) => release());
    },
    holdEconomy: () => {
      holdEconomy = true;
    },
    releaseEconomy: () => {
      holdEconomy = false;
      heldEconomy.splice(0).forEach((release) => release());
    },
    holdDeletes: () => {
      holdDeletes = true;
    },
    releaseDeletes: () => {
      holdDeletes = false;
      heldDeletes.splice(0).forEach((release) => release());
    },
  };
}

/** Every state's base report complete with its districts. */
export function allStatesComplete(): Record<string, StoredStateReport> {
  return Object.fromEntries(ALL_US_STATE_CODES.map((code) => [code, stateReportComplete(code)]));
}

/** How often a state that is still computing is polled. */
export const STATE_POLL_INTERVAL_MS = 5000;

/** How long a state may compute before it fails with Retry. */
export const STATE_TIME_LIMIT_MS = 30 * 60 * 1000;

/** The message once a state computes past its time limit. */
export const STATE_TIME_LIMIT_MESSAGE =
  'Taking much longer than expected. The run may still finish on the server: retry to check it again.';

/** A typical state run, for the clock. */
export const STATE_EXPECTED_MS = 190 * 1000;

/** The economy request a state's run sends: its region and the year, and nothing else. */
export function stateEconomyUrl(region: string, year = STATE_RUNS_YEAR): string {
  const query = new URLSearchParams({ region, time_period: year });
  return `${BASE_URL}/us/economy/${STATE_RUNS_REFORM_POLICY_ID}/over/${STATE_RUNS_BASELINE_POLICY_ID}?${query}`;
}

/** Every state but these ok at once; these answer as `respond` says. */
export function economyWhere(
  respond: Record<string, (request: number) => StateEconomyResponse>,
  others: (region: string, request: number) => StateEconomyResponse = (region) => stateOk(region)
): (region: string, request: number) => StateEconomyResponse {
  return (region, request) =>
    respond[region] ? respond[region](request) : others(region, request);
}

/**
 * A nationwide result whose districts the simulation API built inside the
 * nationwide run: the state runs replace them, so they are never shown.
 */
export const NATIONWIDE_OUTPUT_WITH_DISTRICTS = createMockSocietyWideOutput({
  congressional_district_impact: {
    districts: [
      {
        district: 'AL-01',
        average_household_income_change: 999,
        relative_household_income_change: 0.09,
      },
    ],
  },
}) as SocietyWideReportOutput;

/** A Utah report's own result, with its districts. */
export const UTAH_REPORT_OUTPUT = stateResult(UTAH);

/** A Utah report's result whose districts are null. */
export const UTAH_REPORT_OUTPUT_WITHOUT_DISTRICTS = stateResult(UTAH, null);
