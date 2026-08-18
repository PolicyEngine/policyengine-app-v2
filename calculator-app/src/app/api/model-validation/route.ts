// Model track record, served from the live PolicyEngine scorecard —
// the deployed score repository at policyengine.org/scorecard. We read
// the same published data shards the scorecard app renders, so the
// numbers here always match what a click-through shows. The Urban
// State of the Safety Net shard (~10MB) is cached server-side and
// reduced to the compact, comparable US-level rows for the programs a
// bill or reform touches.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SCORECARD_DATA_URL =
  process.env.SCORECARD_DATA_URL ??
  "https://www.policyengine.org/scorecard/data/sources/urban_sotsn.json";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const MAX_ROWS_PER_PROGRAM = 8;

interface ScorecardShard {
  id: string;
  row_defaults: Record<string, unknown>;
  rows: ScorecardRow[];
}

interface ScorecardRow {
  program: string;
  metric: string;
  geography: string;
  subgroup?: string;
  unit?: string | null;
  status: string;
  relationship?: string;
  value: number | null;
  ratio: number | null;
  pe?: { value?: number | null } | null;
}

let cached: { promise: Promise<ScorecardShard>; fetchedAt: number } | null =
  null;

function getShard(): Promise<ScorecardShard> {
  if (!cached || Date.now() - cached.fetchedAt > CACHE_TTL_MS) {
    const promise = (async () => {
      const response = await fetch(SCORECARD_DATA_URL);
      if (!response.ok) {
        throw new Error(`scorecard fetch failed: ${response.status}`);
      }
      return (await response.json()) as ScorecardShard;
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

  let shard: ScorecardShard;
  try {
    shard = await getShard();
  } catch {
    return Response.json(
      { error: "scorecard data unavailable" },
      { status: 502 },
    );
  }

  const defaults = shard.row_defaults ?? {};
  const defaultRelationship =
    typeof defaults.relationship === "string" ? defaults.relationship : null;
  const period =
    [defaults.period, String(defaults.time_basis ?? "").replaceAll("_", " ")]
      .filter(Boolean)
      .join(" ") || null;

  const wanted = new Set(programs);
  const matched = (shard.rows ?? []).filter(
    (row) =>
      wanted.has(row.program) &&
      row.geography === "US" &&
      (row.subgroup ?? "total") === "total" &&
      (row.status === "comparable" || row.status === "constructed") &&
      typeof row.pe?.value === "number" &&
      typeof row.value === "number" &&
      typeof row.ratio === "number",
  );

  // Held-out comparisons are true validation (the dataset was not tuned
  // to them), so they lead; within that, plain comparable before
  // constructed approximations.
  const relationshipOf = (row: ScorecardRow) =>
    row.relationship ?? defaultRelationship;
  const rank = (row: ScorecardRow) =>
    (relationshipOf(row) === "held_out" ? 0 : 2) +
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
        source: shard.id ?? "urban_sotsn",
        program: row.program,
        metric: row.metric,
        period,
        status: row.status,
        unitConcept: row.unit ?? null,
        externalValue: row.value,
        peValue: row.pe!.value,
        ratio: row.ratio,
        heldOut: relationshipOf(row) === "held_out",
      })),
    },
    { headers: { "Cache-Control": "public, max-age=3600" } },
  );
}
