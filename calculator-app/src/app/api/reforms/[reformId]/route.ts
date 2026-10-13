import {
  flagshipApiDisabledResponse,
  isFlagshipApiEnabled,
} from "@/libs/flagship/apiGate";
import { eq } from "drizzle-orm";
import { reformBaselines, reformSources } from "@/types/ingredients/Reform";
import type { ReformUpdateMetadata } from "@/types/metadata/reformMetadata";
import { getDb, isDbConfigured } from "../../../../db";
import { invalidText, readJsonBody } from "../../../../db/limits";
import { isUuid, presentsEditToken } from "../../../../db/ownership";
import { reforms } from "../../../../db/schema";
import { reformRowToMetadata } from "../../../../db/serialize";

// Handlers use Web-standard Request/Response (not next/server): these files
// are also typechecked inside app/tsconfig.json's program, and importing
// next/server would pull Next's React typings into the Vite app's graph.
//
// Reads need only the unguessable id. Changes also need the edit token the
// creating browser received (see db/ownership.ts); legacy rows without one
// are read-only.

type RouteContext = { params: Promise<{ reformId: string }> };

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function dbUnavailable(): Response {
  return json({ error: "Reform store is not configured" }, 503);
}

function notFound(): Response {
  return json({ error: "Reform not found" }, 404);
}

/**
 * 404 when the reform does not exist, 403 when the request lacks its
 * edit token; null when the change may go ahead.
 */
async function denyUnlessEditable(
  request: Request,
  reformId: string,
): Promise<Response | null> {
  const [row] = await getDb()
    .select({ editTokenHash: reforms.editTokenHash })
    .from(reforms)
    .where(eq(reforms.id, reformId));
  if (!row) {
    return notFound();
  }
  if (!(await presentsEditToken(request, row.editTokenHash))) {
    return json(
      { error: "This reform can only be changed by its creator" },
      403,
    );
  }
  return null;
}

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  if (!isFlagshipApiEnabled()) {
    return flagshipApiDisabledResponse();
  }
  if (!isDbConfigured()) {
    return dbUnavailable();
  }

  const { reformId } = await context.params;
  if (!isUuid(reformId)) {
    return notFound();
  }

  const [row] = await getDb()
    .select()
    .from(reforms)
    .where(eq(reforms.id, reformId));
  if (!row) {
    return notFound();
  }

  return json(reformRowToMetadata(row));
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  if (!isFlagshipApiEnabled()) {
    return flagshipApiDisabledResponse();
  }
  if (!isDbConfigured()) {
    return dbUnavailable();
  }

  const { reformId } = await context.params;
  if (!isUuid(reformId)) {
    return notFound();
  }
  const denied = await denyUnlessEditable(request, reformId);
  if (denied) {
    return denied;
  }

  const parsed = await readJsonBody(request);
  if ("error" in parsed) {
    return json({ error: parsed.error }, parsed.status);
  }
  const payload = (parsed.body ?? {}) as ReformUpdateMetadata;

  const updates: Partial<typeof reforms.$inferInsert> = {};
  if (payload.label !== undefined) {
    const labelError = invalidText("label", payload.label);
    if (labelError) {
      return json({ error: labelError }, 400);
    }
    updates.label = payload.label;
  }
  if (payload.policy_id !== undefined) {
    updates.policyId = payload.policy_id;
  }
  if (payload.parameters !== undefined) {
    if (!Array.isArray(payload.parameters)) {
      return json({ error: "parameters must be an array" }, 400);
    }
    updates.parameters = payload.parameters;
  }
  if (payload.baseline !== undefined) {
    if (!reformBaselines.includes(payload.baseline)) {
      return json(
        { error: `baseline must be one of: ${reformBaselines.join(", ")}` },
        400,
      );
    }
    updates.baseline = payload.baseline;
  }
  if (payload.provenance !== undefined) {
    if (
      !payload.provenance ||
      !reformSources.includes(payload.provenance.source)
    ) {
      return json(
        {
          error: `provenance.source must be one of: ${reformSources.join(", ")}`,
        },
        400,
      );
    }
    updates.provenance = payload.provenance;
  }
  if (Object.keys(updates).length === 0) {
    return json({ error: "No updatable fields provided" }, 400);
  }
  updates.updatedAt = new Date();

  const [row] = await getDb()
    .update(reforms)
    .set(updates)
    .where(eq(reforms.id, reformId))
    .returning();

  if (!row) {
    return notFound();
  }

  return json(reformRowToMetadata(row));
}

export async function DELETE(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  if (!isFlagshipApiEnabled()) {
    return flagshipApiDisabledResponse();
  }
  if (!isDbConfigured()) {
    return dbUnavailable();
  }

  const { reformId } = await context.params;
  if (!isUuid(reformId)) {
    return notFound();
  }
  const denied = await denyUnlessEditable(request, reformId);
  if (denied) {
    return denied;
  }

  const [row] = await getDb()
    .delete(reforms)
    .where(eq(reforms.id, reformId))
    .returning();
  if (!row) {
    return notFound();
  }

  return json({ deleted: true });
}
