import {
  flagshipApiDisabledResponse,
  isFlagshipApiEnabled,
} from "@/libs/flagship/apiGate";
import { eq } from "drizzle-orm";
import { reformBaselines, reformSources } from "@/types/ingredients/Reform";
import type { ReformUpdateMetadata } from "@/types/metadata/reformMetadata";
import { getDb, isDbConfigured } from "../../../../db";
import { reforms } from "../../../../db/schema";
import { reformRowToMetadata } from "../../../../db/serialize";

// Handlers use Web-standard Request/Response (not next/server): these files
// are also typechecked inside app/tsconfig.json's program, and importing
// next/server would pull Next's React typings into the Vite app's graph.

type RouteContext = { params: Promise<{ reformId: string }> };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  if (!UUID_PATTERN.test(reformId)) {
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
  if (!UUID_PATTERN.test(reformId)) {
    return notFound();
  }

  let payload: ReformUpdateMetadata;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const updates: Partial<typeof reforms.$inferInsert> = {};
  if (payload.label !== undefined) {
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
  if (!UUID_PATTERN.test(reformId)) {
    return notFound();
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
