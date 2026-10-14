import {
  flagshipApiDisabledResponse,
  isFlagshipApiEnabled,
} from "@/libs/flagship/apiGate";
import { eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "../../../../db";
import { readJsonBody } from "../../../../db/limits";
import { guardSchema } from "../../../../db/errors";
import { isUuid, presentsEditToken } from "../../../../db/ownership";
import { reports } from "../../../../db/schema";
import { reportRowToMetadata } from "../../../../db/serialize";

// Reads need only the unguessable id; pinning a validation also needs the
// edit token the creating browser received. Legacy rows are read-only.

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function handleGET(
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
  if (!isUuid(reportId)) {
    return json({ error: "Report not found" }, 404);
  }
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
async function handlePATCH(
  request: Request,
  { params }: { params: Promise<{ reportId: string }> },
): Promise<Response> {
  if (!isFlagshipApiEnabled()) {
    return flagshipApiDisabledResponse();
  }
  if (!isDbConfigured()) {
    return json({ error: "Report store is not configured" }, 503);
  }

  const { reportId } = await params;
  if (!isUuid(reportId)) {
    return json({ error: "Report not found" }, 404);
  }
  const [owner] = await getDb()
    .select({ editTokenHash: reports.editTokenHash })
    .from(reports)
    .where(eq(reports.id, reportId));
  if (!owner) {
    return json({ error: "Report not found" }, 404);
  }
  if (!(await presentsEditToken(request, owner.editTokenHash))) {
    return json(
      { error: "This report can only be changed by its creator" },
      403,
    );
  }

  const parsed = await readJsonBody(request);
  if ("error" in parsed) {
    return json({ error: parsed.error }, parsed.status);
  }
  const payload: any = parsed.body;
  if (!isValidationPayload(payload?.validation)) {
    return json({ error: "validation snapshot is required" }, 400);
  }

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

// A database missing the latest migration answers 503, not 500 (see db/errors).
export async function GET(
  ...args: Parameters<typeof handleGET>
): Promise<Response> {
  return guardSchema(() => handleGET(...args));
}

export async function PATCH(
  ...args: Parameters<typeof handlePATCH>
): Promise<Response> {
  return guardSchema(() => handlePATCH(...args));
}
