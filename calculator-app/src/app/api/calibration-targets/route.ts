import {
  flagshipApiDisabledResponse,
  isFlagshipApiEnabled,
} from "@/libs/flagship/apiGate";
import {
  type CalibrationCountry,
  type CalibrationTargetRow,
  isCalibrationCountry,
  nationalGeography,
  normalizeCalibrationTarget,
  targetsForGeography,
  targetsForVariables,
} from "@/libs/flagship/calibrationTargets";

// Calibration targets for a set of model variables in one geography, from
// the calibration dashboard's per-target diagnostics for the current
// populace release. The dashboard filters by its own label keys, not by
// PolicyEngine variable names, so this route pulls the full target set
// once (a dozen 500-row pages), caches it, and indexes it by
// `policyengine_variables` — the join key the validation layer uses (or
// the target's role, when that is a model variable and the dashboard
// lists none). With `all`, it answers every target of one geography
// instead: a state's overall data fit, whatever the reform changes.
//
// `country` picks the dashboard's country: "us" (the default, asked
// without a country parameter, as before) or "uk" (asked with
// country=uk). Each country's set is fetched and cached on its own. UK
// targets name their area ("Wales", "Great Britain"), so a UK request
// passes names, and may pass several (`geographies`): a nation report
// reads the nation's targets and those of the UK and Great Britain.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BASE_URL =
  process.env.CALIBRATION_API_URL ??
  "https://calibration-diagnostics.vercel.app/calibration/dashboard/api/microcosm";
const PAGE_SIZE = 500;
const MAX_PAGES = 40;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
// Browsers may keep a response for an hour in production; a dev server
// must not, or a route change hides behind the previous answer.
const CACHE_CONTROL =
  process.env.NODE_ENV === "production" ? "public, max-age=3600" : "no-store";
const MAX_ROWS_PER_VARIABLE = 500;

interface TargetSet {
  releaseId: string | null;
  rows: CalibrationTargetRow[];
}

const cache = new Map<
  CalibrationCountry,
  { promise: Promise<TargetSet>; fetchedAt: number }
>();

function pageUrl(country: CalibrationCountry, page: number): string {
  const url = `${BASE_URL}/target-diagnostics?limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`;
  // The dashboard serves the US without a country parameter.
  return country === "us" ? url : `${url}&country=${country}`;
}

function getTargets(country: CalibrationCountry): Promise<TargetSet> {
  const cached = cache.get(country);
  if (cached && Date.now() - cached.fetchedAt <= CACHE_TTL_MS) {
    return cached.promise;
  }
  const promise = (async () => {
    const rows: CalibrationTargetRow[] = [];
    let releaseId: string | null = null;
    for (let page = 0; page < MAX_PAGES; page++) {
      const response = await fetch(pageUrl(country, page));
      if (!response.ok) {
        throw new Error(`calibration fetch failed: ${response.status}`);
      }
      const payload = await response.json();
      if (page === 0 && typeof payload?.release_id === "string") {
        releaseId = payload.release_id;
      }
      for (const raw of payload?.targets ?? []) {
        const row = normalizeCalibrationTarget(raw, country);
        if (row) {
          rows.push(row);
        }
      }
      if (!payload?.has_next) {
        break;
      }
    }
    if (rows.length === 0) {
      throw new Error("calibration payload had no targets");
    }
    return { releaseId, rows };
  })();
  promise.catch(() => {
    if (cache.get(country)?.promise === promise) {
      cache.delete(country);
    }
  });
  cache.set(country, { promise, fetchedAt: Date.now() });
  return promise;
}

// A reform reaches a few hundred variables, more than a query string
// should carry, so the client POSTs; GET stays for hand checks
// (?variables=a,b&geography=DC, or ?geography=DC&all=1; for the UK
// ?country=uk&geography=Wales,United Kingdom&variables=income_tax).
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const all = url.searchParams.get("all");
  const country = url.searchParams.get("country") ?? "us";
  const geography = url.searchParams.get("geography");
  return respond(
    (url.searchParams.get("variables") ?? "").split(","),
    // A UK area name has no comma, so a UK list is comma-separated.
    country === "uk" && geography ? geography.split(",") : geography,
    all === "1" || all === "true",
    country,
  );
}

export async function POST(request: Request): Promise<Response> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  return respond(
    Array.isArray(body?.variables) ? body.variables : [],
    // A list is for UK reports only; the US reads one geography.
    body?.country === "uk" && Array.isArray(body?.geographies)
      ? body.geographies
      : typeof body?.geography === "string"
        ? body.geography
        : null,
    body?.all === true,
    body?.country ?? "us",
  );
}

async function respond(
  rawVariables: unknown[],
  rawGeography: string | unknown[] | null,
  all: boolean,
  rawCountry: unknown,
): Promise<Response> {
  if (!isFlagshipApiEnabled()) {
    return flagshipApiDisabledResponse();
  }
  const country =
    typeof rawCountry === "string" ? rawCountry.toLowerCase() : rawCountry;
  if (!isCalibrationCountry(country)) {
    return Response.json(
      { error: "country must be us or uk" },
      { status: 400 },
    );
  }
  const variables = rawVariables
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter(Boolean);
  if (!all && variables.length === 0) {
    return Response.json({ error: "variables is required" }, { status: 400 });
  }
  // US geographies are one code ("US", "DC"); UK ones are area names, kept as given.
  const geographies =
    country === "us"
      ? [(typeof rawGeography === "string" ? rawGeography : "US").toUpperCase()]
      : (Array.isArray(rawGeography) ? rawGeography : [rawGeography])
          .filter((g): g is string => typeof g === "string")
          .map((g) => g.trim())
          .filter(Boolean);
  if (geographies.length === 0) {
    geographies.push(nationalGeography(country));
  }
  const geography = geographies[0];
  const where = geographies.length === 1 ? geography : geographies;

  let targets: TargetSet;
  try {
    targets = await getTargets(country);
  } catch {
    return Response.json(
      { error: "calibration data unavailable" },
      { status: 502 },
    );
  }

  const rows = all
    ? targetsForGeography(targets.rows, where)
    : targetsForVariables(
        targets.rows,
        variables,
        where,
        MAX_ROWS_PER_VARIABLE,
      );

  return Response.json(
    {
      releaseId: targets.releaseId,
      geography,
      ...(geographies.length > 1 ? { geographies } : {}),
      rows,
    },
    { headers: { "Cache-Control": CACHE_CONTROL } },
  );
}
