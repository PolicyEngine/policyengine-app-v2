import { and, desc, eq } from "drizzle-orm";
import { countryIds } from "@/libs/countries";
import { getDb, isDbConfigured } from "../../../db";
import { reports } from "../../../db/schema";
import { reportRowToMetadata } from "../../../db/serialize";

// Web-standard Request/Response for the same reason as api/reforms: these
// files are typechecked inside app/tsconfig.json's program too.
//
// NOTE: user_id is client-supplied, matching the anonymous trust model of
// the reform store. Revisit when real authentication lands.

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
  if (typeof payload.user_id !== "string" || !payload.user_id) {
    return "user_id is required";
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
  return null;
}

export async function GET(request: Request): Promise<Response> {
  if (!isDbConfigured()) {
    return dbUnavailable();
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");
  if (!userId) {
    return json({ error: "user_id is required" }, 400);
  }
  const countryId = searchParams.get("country_id");

  const conditions = countryId
    ? and(eq(reports.userId, userId), eq(reports.countryId, countryId))
    : eq(reports.userId, userId);

  const rows = await getDb()
    .select()
    .from(reports)
    .where(conditions)
    .orderBy(desc(reports.createdAt));

  return json(rows.map(reportRowToMetadata));
}

export async function POST(request: Request): Promise<Response> {
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

  const [row] = await getDb()
    .insert(reports)
    .values({
      userId: payload.user_id,
      countryId: payload.country_id,
      apiReportId: payload.api_report_id,
      title: payload.title ?? null,
      sourceNote: payload.source_note ?? null,
      provisions: payload.provisions,
      reformId: payload.reform_id ?? null,
      year: payload.year,
    })
    .returning();

  return json(reportRowToMetadata(row), 201);
}
