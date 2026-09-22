import {
  flagshipApiDisabledResponse,
  isFlagshipApiEnabled,
} from "@/libs/flagship/apiGate";
import {
  matchScorecardClaims,
  type ScorecardClaim,
} from "@/libs/flagship/scorecardComparisons";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
const SOURCE =
  process.env.SCORECARD_POPULATIONS_URL ??
  "https://www.policyengine.org/scorecard/data/populations.json";
let cache: {
  at: number;
  value: Promise<{ built: string | null; rows: ScorecardClaim[] }>;
} | null = null;

function loadClaims() {
  if (!cache || Date.now() - cache.at > 60 * 60 * 1000) {
    const value = fetch(SOURCE, {
      signal: AbortSignal.timeout(20000),
      cache: "no-store",
    }).then(async (response) => {
      if (!response.ok) {
        throw new Error("Scorecard unavailable");
      }
      const data = await response.json();
      if (!Array.isArray(data.rows)) {
        throw new Error("Invalid scorecard feed");
      }
      return {
        built: typeof data.built === "string" ? data.built : null,
        rows: data.rows.filter(
          (row: ScorecardClaim) =>
            typeof row?.claim_id === "string" &&
            typeof row.country === "string" &&
            typeof row.name === "string" &&
            typeof row.reform_framework === "string" &&
            typeof row.metric === "string" &&
            typeof row.unit_concept === "string" &&
            typeof row.external_value === "number" &&
            Number.isFinite(row.external_value),
        ) as ScorecardClaim[],
      };
    });
    cache = { at: Date.now(), value };
    value.catch(() => {
      cache = null;
    });
  }
  return cache.value;
}

export async function POST(request: Request): Promise<Response> {
  if (!isFlagshipApiEnabled()) {
    return flagshipApiDisabledResponse();
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const strings = (value: unknown): string[] =>
    Array.isArray(value)
      ? value.filter((v): v is string => typeof v === "string")
      : [];
  const paths = strings(body?.paths);
  const variables = strings(body?.variables);
  if (
    typeof body?.country !== "string" ||
    (!paths.length && !variables.length)
  ) {
    return Response.json(
      { error: "country and paths or variables are required" },
      { status: 400 },
    );
  }
  try {
    const data = await loadClaims();
    const matched = matchScorecardClaims(
      data.rows,
      body.country,
      paths,
      variables,
    );
    // History is available in the scorecard; the report displays each claim's latest receipt.
    const rows = matched.rows.map((row) => {
      const { results: _history, ...claim } = row as typeof row & {
        results?: unknown;
      };
      return claim;
    });
    return Response.json(
      { built: data.built, ...matched, rows },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Scorecard comparisons are temporarily unavailable" },
      { status: 502 },
    );
  }
}
