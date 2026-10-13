import {
  flagshipApiDisabledResponse,
  isFlagshipApiEnabled,
} from "@/libs/flagship/apiGate";
import { desc, inArray } from "drizzle-orm";
import { countryIds } from "@/libs/countries";
import { getDb, isDbConfigured } from "../../../db";
import {
  isUuid,
  issueEditToken,
  MAX_IDS_PER_REQUEST,
  parseIdList,
} from "../../../db/ownership";
import { reports } from "../../../db/schema";
import { reportRowToMetadata } from "../../../db/serialize";

// Web-standard Request/Response for the same reason as api/reforms: these
// files are typechecked inside app/tsconfig.json's program too.
//
// Same anonymous ownership as api/reforms: no user identifier and no
// request metadata stored, batch reads by id only, and an edit token for
// changes. There is deliberately no lookup by api_report_id: API report
// ids are sequential, so that lookup would let anyone enumerate records.

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function dbUnavailable(): Response {
  return json({ error: "Report store is not configured" }, 503);
}

function validateCreationPayload(payload: any): string | null {
  if (!payload || typeof payload !== "object") {
    return "Invalid JSON body";
  }
  if (!countryIds.includes(payload.country_id)) {
    return `country_id must be one of: ${countryIds.join(", ")}`;
  }
  if (typeof payload.api_report_id !== "string" || !payload.api_report_id) {
    return "api_report_id is required";
  }
  if (!Array.isArray(payload.provisions)) {
    return "provisions must be an array";
  }
  if (typeof payload.year !== "string" || !payload.year) {
    return "year is required";
  }
  if (
    payload.reform_id != null &&
    (typeof payload.reform_id !== "string" || !isUuid(payload.reform_id))
  ) {
    return "reform_id must be a central reform id or null";
  }
  return null;
}

export async function GET(request: Request): Promise<Response> {
  if (!isFlagshipApiEnabled()) {
    return flagshipApiDisabledResponse();
  }
  if (!isDbConfigured()) {
    return dbUnavailable();
  }

  const ids = parseIdList(new URL(request.url).searchParams);
  if (!ids) {
    return json(
      {
        error: `ids must list up to ${MAX_IDS_PER_REQUEST} comma-separated report ids`,
      },
      400,
    );
  }
  if (ids.length === 0) {
    return json([]);
  }

  const rows = await getDb()
    .select()
    .from(reports)
    .where(inArray(reports.id, ids))
    .orderBy(desc(reports.createdAt));

  return json(rows.map(reportRowToMetadata));
}

export async function POST(request: Request): Promise<Response> {
  if (!isFlagshipApiEnabled()) {
    return flagshipApiDisabledResponse();
  }
  if (!isDbConfigured()) {
    return dbUnavailable();
  }

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const validationError = validateCreationPayload(payload);
  if (validationError) {
    return json({ error: validationError }, 400);
  }

  const { token, hash } = await issueEditToken();
  const [row] = await getDb()
    .insert(reports)
    .values({
      editTokenHash: hash,
      countryId: payload.country_id,
      apiReportId: payload.api_report_id,
      title: payload.title ?? null,
      sourceNote: payload.source_note ?? null,
      provisions: payload.provisions,
      reformId: payload.reform_id ?? null,
      year: payload.year,
    })
    .returning();

  // The only time the token leaves the server; the row keeps its hash.
  return json({ ...reportRowToMetadata(row), edit_token: token }, 201);
}
