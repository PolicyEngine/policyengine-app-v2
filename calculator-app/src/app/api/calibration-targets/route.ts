// Calibration targets for a set of model variables in one geography, from
// the calibration dashboard's per-target diagnostics for the current
// populace release. The dashboard filters by its own label keys, not by
// PolicyEngine variable names, so this route pulls the full target set
// once (a dozen 500-row pages), caches it, and indexes it by
// `policyengine_variables` — the join key the validation layer uses.
//
// Read-only and public: it carries no user data, so it serves the
// production report page as well as the flagship shell.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BASE_URL =
  process.env.CALIBRATION_API_URL ??
  "https://calibration-diagnostics.vercel.app/calibration/dashboard/api/populace";
const PAGE_SIZE = 500;
const MAX_PAGES = 40;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
// Browsers may keep a response for an hour in production; a dev server
// must not, or a route change hides behind the previous answer.
const CACHE_CONTROL =
  process.env.NODE_ENV === "production" ? "public, max-age=3600" : "no-store";
const MAX_ROWS_PER_VARIABLE = 500;

interface TargetRow {
  name: string;
  source: string;
  sourceLabel: string | null;
  variable: string;
  policyengineVariables: string[];
  measure: string | null;
  level: "national" | "state";
  geography: string;
  period: number | string | null;
  target: number | null;
  estimate: number | null;
  relativeError: number | null;
  targetRole: string | null;
  sourceUrl: string | null;
}

interface TargetSet {
  releaseId: string | null;
  rows: TargetRow[];
}

function normalize(raw: any): TargetRow | null {
  if (typeof raw?.name !== "string") {
    return null;
  }
  const level = raw.level === "national" ? "national" : "state";
  return {
    name: raw.name,
    source: String(raw.source ?? ""),
    sourceLabel: typeof raw.source_label === "string" ? raw.source_label : null,
    variable: String(raw.variable ?? ""),
    policyengineVariables: Array.isArray(raw.policyengine_variables)
      ? raw.policyengine_variables.filter((v: unknown) => typeof v === "string")
      : [],
    measure: typeof raw.measure === "string" ? raw.measure : null,
    level,
    geography:
      level === "national" ? "US" : String(raw.state ?? raw.geography ?? ""),
    period: raw.period ?? null,
    target: typeof raw.target === "number" ? raw.target : null,
    estimate:
      typeof raw.final_estimate === "number" ? raw.final_estimate : null,
    relativeError:
      typeof raw.relative_error === "number" ? raw.relative_error : null,
    targetRole: typeof raw.target_role === "string" ? raw.target_role : null,
    sourceUrl: typeof raw.source_url === "string" ? raw.source_url : null,
  };
}

let cached: { promise: Promise<TargetSet>; fetchedAt: number } | null = null;

function getTargets(): Promise<TargetSet> {
  if (!cached || Date.now() - cached.fetchedAt > CACHE_TTL_MS) {
    const promise = (async () => {
      const rows: TargetRow[] = [];
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
          const row = normalize(raw);
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
// should carry, so the client POSTs; GET stays for hand checks.
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  return respond(
    (url.searchParams.get("variables") ?? "").split(","),
    url.searchParams.get("geography"),
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
  );
}

async function respond(
  rawVariables: unknown[],
  rawGeography: string | null,
): Promise<Response> {
  const variables = rawVariables
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter(Boolean);
  if (variables.length === 0) {
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

  const wanted = new Set(variables);
  const matched = targets.rows.filter(
    (row) =>
      row.geography === geography &&
      typeof row.relativeError === "number" &&
      row.policyengineVariables.some((v) => wanted.has(v)),
  );
  // Worst fit first, then cap per variable so a dense SOI family
  // (hundreds of AGI-band rows) cannot crowd out the rest of the payload
  // while the worst rows always survive the cut.
  matched.sort(
    (a, b) => Math.abs(b.relativeError!) - Math.abs(a.relativeError!),
  );
  const perVariable = new Map<string, number>();
  const rows = matched.filter((row) => {
    const key = row.policyengineVariables.find((v) => wanted.has(v))!;
    const count = perVariable.get(key) ?? 0;
    if (count >= MAX_ROWS_PER_VARIABLE) {
      return false;
    }
    perVariable.set(key, count + 1);
    return true;
  });

  return Response.json(
    { releaseId: targets.releaseId, geography, rows },
    { headers: { "Cache-Control": CACHE_CONTROL } },
  );
}
