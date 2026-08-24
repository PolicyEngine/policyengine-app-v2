import {
  flagshipApiDisabledResponse,
  isFlagshipApiEnabled,
} from "@/libs/flagship/apiGate";
import { and, desc, eq } from "drizzle-orm";
import { reformBaselines, reformSources } from "@/types/ingredients/Reform";
import type { ReformCreationMetadata } from "@/types/metadata/reformMetadata";
import { countryIds } from "@/libs/countries";
import { getDb, isDbConfigured } from "../../../db";
import { reforms } from "../../../db/schema";
import { reformRowToMetadata } from "../../../db/serialize";

// Handlers use Web-standard Request/Response (not next/server): these files
// are also typechecked inside app/tsconfig.json's program, and importing
// next/server would pull Next's React typings into the Vite app's graph.
//
// NOTE: user_id is client-supplied, matching the existing anonymous-UUID
// trust model used by the user-*-association stores. Revisit when real
// authentication lands (flagship phase 2 prerequisite).

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function dbUnavailable(): Response {
  return json({ error: "Reform store is not configured" }, 503);
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
  if (!Array.isArray(payload.parameters)) {
    return "parameters must be an array";
  }
  for (const parameter of payload.parameters) {
    if (
      typeof parameter?.name !== "string" ||
      !Array.isArray(parameter?.values)
    ) {
      return "each parameter needs a name and a values array";
    }
  }
  if (!reformBaselines.includes(payload.baseline)) {
    return `baseline must be one of: ${reformBaselines.join(", ")}`;
  }
  if (
    !payload.provenance ||
    !reformSources.includes(payload.provenance.source)
  ) {
    return `provenance.source must be one of: ${reformSources.join(", ")}`;
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

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");
  if (!userId) {
    return json({ error: "user_id is required" }, 400);
  }
  const countryId = searchParams.get("country_id");

  const conditions = countryId
    ? and(eq(reforms.userId, userId), eq(reforms.countryId, countryId))
    : eq(reforms.userId, userId);

  const rows = await getDb()
    .select()
    .from(reforms)
    .where(conditions)
    .orderBy(desc(reforms.updatedAt));

  return json(rows.map(reformRowToMetadata));
}

export async function POST(request: Request): Promise<Response> {
  if (!isFlagshipApiEnabled()) {
    return flagshipApiDisabledResponse();
  }
  if (!isDbConfigured()) {
    return dbUnavailable();
  }

  let payload: ReformCreationMetadata;
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
    .insert(reforms)
    .values({
      userId: payload.user_id,
      countryId: payload.country_id,
      label: payload.label ?? null,
      policyId: payload.policy_id ?? null,
      parameters: payload.parameters,
      baseline: payload.baseline,
      provenance: payload.provenance,
    })
    .returning();

  return json(reformRowToMetadata(row), 201);
}
