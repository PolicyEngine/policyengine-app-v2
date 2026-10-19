import {
  flagshipApiDisabledResponse,
  isFlagshipApiEnabled,
} from "@/libs/flagship/apiGate";
import {
  type CalibrationTargetRow,
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

let cached: { promise: Promise<TargetSet>; fetchedAt: number } | null = null;

function getTargets(): Promise<TargetSet> {
  if (!cached || Date.now() - cached.fetchedAt > CACHE_TTL_MS) {
    const promise = (async () => {
      const rows: CalibrationTargetRow[] = [];
      let releaseId: string | null = null;
      for (let page = 0; page < MAX_PAGES; page++) {
        const response = await fetch(
          `${BASE_URL}/target-diagnostics?limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`,
        );
        if (!response.ok) {
          throw new Error(`calibration fetch failed: ${response.status}`);
        }
        const payload = await response.json();
        if (page === 0 && typeof payload?.release_id === "string") {
          releaseId = payload.release_id;
        }
        for (const raw of payload?.targets ?? []) {
          const row = normalizeCalibrationTarget(raw);
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
      cached = null;
    });
    cached = { promise, fetchedAt: Date.now() };
  }
  return cached.promise;
}

// A reform reaches a few hundred variables, more than a query string
// should carry, so the client POSTs; GET stays for hand checks
// (?variables=a,b&geography=DC, or ?geography=DC&all=1).
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const all = url.searchParams.get("all");
  return respond(
    (url.searchParams.get("variables") ?? "").split(","),
    url.searchParams.get("geography"),
    all === "1" || all === "true",
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
    typeof body?.geography === "string" ? body.geography : null,
    body?.all === true,
  );
}

async function respond(
  rawVariables: unknown[],
  rawGeography: string | null,
  all: boolean,
): Promise<Response> {
  if (!isFlagshipApiEnabled()) {
    return flagshipApiDisabledResponse();
  }
  const variables = rawVariables
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter(Boolean);
  if (!all && variables.length === 0) {
    return Response.json({ error: "variables is required" }, { status: 400 });
  }
  const geography = (rawGeography ?? "US").toUpperCase();

  let targets: TargetSet;
  try {
    targets = await getTargets();
  } catch {
    return Response.json(
      { error: "calibration data unavailable" },
      { status: 502 },
    );
  }

  const rows = all
    ? targetsForGeography(targets.rows, geography)
    : targetsForVariables(
        targets.rows,
        variables,
        geography,
        MAX_ROWS_PER_VARIABLE,
      );

  return Response.json(
    { releaseId: targets.releaseId, geography, rows },
    { headers: { "Cache-Control": CACHE_CONTROL } },
  );
}
