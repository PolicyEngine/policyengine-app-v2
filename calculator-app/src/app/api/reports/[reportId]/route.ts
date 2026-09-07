import {
  flagshipApiDisabledResponse,
  isFlagshipApiEnabled,
} from "@/libs/flagship/apiGate";
import { eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "../../../../db";
import { reports } from "../../../../db/schema";
import { reportRowToMetadata } from "../../../../db/serialize";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ reportId: string }> },
): Promise<Response> {
  if (!isFlagshipApiEnabled()) {
    return flagshipApiDisabledResponse();
  }
  if (!isDbConfigured()) {
    return json({ error: "Report store is not configured" }, 503);
  }

  const { reportId } = await params;
  const [row] = await getDb()
    .select()
    .from(reports)
    .where(eq(reports.id, reportId));

  if (!row) {
    return json({ error: "Report not found" }, 404);
  }
  return json(reportRowToMetadata(row));
}

function isValidationPayload(value: any): boolean {
  return (
    !!value &&
    typeof value === "object" &&
    typeof value.matched_at === "string" &&
    typeof value.map_model_version === "string" &&
    (value.calibration === null || typeof value.calibration === "object") &&
    (value.scorecard === null || typeof value.scorecard === "object")
  );
}

/** Pins what validation matched the report against. Idempotent. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ reportId: string }> },
): Promise<Response> {
  if (!isFlagshipApiEnabled()) {
    return flagshipApiDisabledResponse();
  }
  if (!isDbConfigured()) {
    return json({ error: "Report store is not configured" }, 503);
  }

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  if (!isValidationPayload(payload?.validation)) {
    return json({ error: "validation snapshot is required" }, 400);
  }

  const { reportId } = await params;
  const [row] = await getDb()
    .update(reports)
    .set({ validation: payload.validation })
    .where(eq(reports.id, reportId))
    .returning();

  if (!row) {
    return json({ error: "Report not found" }, 404);
  }
  return json(reportRowToMetadata(row));
}
