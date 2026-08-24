import {
  flagshipApiDisabledResponse,
  isFlagshipApiEnabled,
} from "@/libs/flagship/apiGate";

// Model track record, served from the live PolicyEngine scorecard at
// policyengine.org/scorecard. The deployed app's data layout has
// changed once already (per-source shards -> single comparison file),
// so this route tries each known layout in order and normalizes both
// row shapes; the GitHub repo's committed file is the final fallback.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DATA_URLS = [
  process.env.SCORECARD_DATA_URL,
  "https://www.policyengine.org/scorecard/data/comparison.json",
  "https://www.policyengine.org/scorecard/data/sources/urban_sotsn.json",
  "https://raw.githubusercontent.com/PolicyEngine/policyengine-scorecard/main/data/comparison.json",
].filter(Boolean) as string[];
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const MAX_ROWS_PER_PROGRAM = 8;

interface NormalizedRow {
  source: string;
  program: string;
  metric: string;
  geography: string;
  subgroup: string;
  unit: string | null;
  period: string | null;
  status: string;
  externalValue: number | null;
  peValue: number | null;
  ratio: number | null;
  heldOut: boolean;
}

function normalize(payload: any): NormalizedRow[] {
  const rows: any[] = payload?.rows ?? [];
  if (rows.length === 0) {
    return [];
  }
  const defaults = payload?.row_defaults ?? {};
  const defaultRelationship =
    typeof defaults.relationship === "string" ? defaults.relationship : null;
  const defaultPeriod =
    [defaults.period, String(defaults.time_basis ?? "").replaceAll("_", " ")]
      .filter(Boolean)
      .join(" ") || null;

  return rows.map((row): NormalizedRow => {
    // comparison.json shape: external_value / pe_value / calibration_relationship
    if ("external_value" in row) {
      return {
        source: row.source ?? "scorecard",
        program: row.program,
        metric: row.metric,
        geography: row.geography,
        subgroup: row.subgroup ?? "total",
        unit: row.unit_concept ?? null,
        period: row.period ?? null,
        status: row.status,
        externalValue:
          typeof row.external_value === "number" ? row.external_value : null,
        peValue: typeof row.pe_value === "number" ? row.pe_value : null,
        ratio: typeof row.ratio === "number" ? row.ratio : null,
        heldOut: row.calibration_relationship === "held_out",
      };
    }
    // per-source shard shape: value / pe.value / relationship (+ row_defaults)
    return {
      source: payload?.id ?? "scorecard",
      program: row.program,
      metric: row.metric,
      geography: row.geography,
      subgroup: row.subgroup ?? "total",
      unit: row.unit ?? null,
      period: row.period ?? defaultPeriod,
      status: row.status,
      externalValue: typeof row.value === "number" ? row.value : null,
      peValue: typeof row.pe?.value === "number" ? row.pe.value : null,
      ratio: typeof row.ratio === "number" ? row.ratio : null,
      heldOut: (row.relationship ?? defaultRelationship) === "held_out",
    };
  });
}

let cached: { promise: Promise<NormalizedRow[]>; fetchedAt: number } | null =
  null;

function getRows(): Promise<NormalizedRow[]> {
  if (!cached || Date.now() - cached.fetchedAt > CACHE_TTL_MS) {
    const promise = (async () => {
      let lastError: unknown = new Error("no scorecard data URLs configured");
      for (const url of DATA_URLS) {
        try {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(
              `scorecard fetch failed: ${response.status} (${url})`,
            );
          }
          const rows = normalize(await response.json());
          if (rows.length > 0) {
            return rows;
          }
          throw new Error(`scorecard payload had no rows (${url})`);
        } catch (error) {
          lastError = error;
        }
      }
      throw lastError;
    })();
    promise.catch(() => {
      cached = null;
    });
    cached = { promise, fetchedAt: Date.now() };
  }
  return cached.promise;
}

export async function GET(request: Request): Promise<Response> {
  if (!isFlagshipApiEnabled()) {
    return flagshipApiDisabledResponse();
  }
  const url = new URL(request.url);
  const programs = (url.searchParams.get("programs") ?? "")
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
  if (programs.length === 0) {
    return Response.json({ error: "programs is required" }, { status: 400 });
  }

  let rows: NormalizedRow[];
  try {
    rows = await getRows();
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
      typeof row.peValue === "number" &&
      typeof row.externalValue === "number" &&
      typeof row.ratio === "number",
  );

  // Held-out comparisons are true validation (the dataset was not tuned
  // to them), so they lead; within that, plain comparable before
  // constructed approximations.
  const rank = (row: NormalizedRow) =>
    (row.heldOut ? 0 : 2) + (row.status === "comparable" ? 0 : 1);
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
        unitConcept: row.unit,
        externalValue: row.externalValue,
        peValue: row.peValue,
        ratio: row.ratio,
        heldOut: row.heldOut,
      })),
    },
    { headers: { "Cache-Control": "public, max-age=3600" } },
  );
}
