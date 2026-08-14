// Model track record, served from the PolicyEngine scorecard — the
// repo that compares PolicyEngine/Populace estimates against external
// analyses (Urban Institute's State of the Safety Net, and future
// sources) with per-row honesty statuses. The published comparison
// artifact is ~20MB, so this route caches it server-side and returns
// only the compact, comparable US-level rows for the programs a bill
// or reform touches.

export const dynamic = "force-dynamic";

const SCORECARD_URL =
  process.env.SCORECARD_COMPARISON_URL ??
  "https://raw.githubusercontent.com/PolicyEngine/policyengine-scorecard/main/data/comparison.json";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const MAX_ROWS_PER_PROGRAM = 8;

interface ScorecardRow {
  source: string;
  program: string;
  metric: string;
  subgroup: string;
  geography: string;
  unit_concept: string | null;
  period: string | null;
  status: string;
  external_value: number | null;
  pe_value: number | null;
  ratio: number | null;
  calibration_relationship: string | null;
}

let cached: { promise: Promise<ScorecardRow[]>; fetchedAt: number } | null =
  null;

function getScorecardRows(): Promise<ScorecardRow[]> {
  if (!cached || Date.now() - cached.fetchedAt > CACHE_TTL_MS) {
    const promise = (async () => {
      const response = await fetch(SCORECARD_URL);
      if (!response.ok) {
        throw new Error(`scorecard fetch failed: ${response.status}`);
      }
      const payload = await response.json();
      return (payload?.rows ?? []) as ScorecardRow[];
    })();
    promise.catch(() => {
      cached = null;
    });
    cached = { promise, fetchedAt: Date.now() };
  }
  return cached.promise;
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const programs = (url.searchParams.get("programs") ?? "")
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
  if (programs.length === 0) {
    return Response.json({ error: "programs is required" }, { status: 400 });
  }

  let rows: ScorecardRow[];
  try {
    rows = await getScorecardRows();
  } catch {
    return Response.json(
      { error: "scorecard data unavailable" },
      { status: 502 },
    );
  }

  const wanted = new Set(programs);
  const matched = rows.filter(
    (row) =>
      wanted.has(row.program) &&
      row.geography === "US" &&
      row.subgroup === "total" &&
      (row.status === "comparable" || row.status === "constructed") &&
      typeof row.pe_value === "number" &&
      typeof row.external_value === "number" &&
      typeof row.ratio === "number",
  );

  // Held-out comparisons are true validation (the dataset was not tuned
  // to them), so they lead; within that, plain comparable before
  // constructed approximations.
  const rank = (row: ScorecardRow) =>
    (row.calibration_relationship === "held_out" ? 0 : 2) +
    (row.status === "comparable" ? 0 : 1);
  matched.sort(
    (a, b) =>
      a.program.localeCompare(b.program) ||
      rank(a) - rank(b) ||
      a.metric.localeCompare(b.metric),
  );

  const perProgram = new Map<string, number>();
  const selected = matched.filter((row) => {
    const count = perProgram.get(row.program) ?? 0;
    if (count >= MAX_ROWS_PER_PROGRAM) {
      return false;
    }
    perProgram.set(row.program, count + 1);
    return true;
  });

  return Response.json(
    {
      rows: selected.map((row) => ({
        source: row.source,
        program: row.program,
        metric: row.metric,
        period: row.period,
        status: row.status,
        unitConcept: row.unit_concept,
        externalValue: row.external_value,
        peValue: row.pe_value,
        ratio: row.ratio,
        heldOut: row.calibration_relationship === "held_out",
      })),
    },
    { headers: { "Cache-Control": "public, max-age=3600" } },
  );
}
