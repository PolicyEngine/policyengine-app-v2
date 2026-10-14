import {
  flagshipApiDisabledResponse,
  isFlagshipApiEnabled,
} from "@/libs/flagship/apiGate";
import { desc, inArray } from "drizzle-orm";
import { reformBaselines, reformSources } from "@/types/ingredients/Reform";
import type {
  ReformCreatedMetadata,
  ReformCreationMetadata,
} from "@/types/metadata/reformMetadata";
import { countryIds } from "@/libs/countries";
import { getDb, isDbConfigured } from "../../../db";
import {
  invalidText,
  insertWithinBudget,
  newRowBudgetResponse,
  readJsonBody,
} from "../../../db/limits";
import { guardSchema } from "../../../db/errors";
import {
  issueEditToken,
  MAX_IDS_PER_REQUEST,
  parseIdList,
} from "../../../db/ownership";
import { reforms } from "../../../db/schema";
import { reformRowToMetadata } from "../../../db/serialize";

// Handlers use Web-standard Request/Response (not next/server): these files
// are also typechecked inside app/tsconfig.json's program, and importing
// next/server would pull Next's React typings into the Vite app's graph.
//
// Anonymous ownership (no sign-in yet): rows carry no user identifier, and
// the handlers read no IP address, user agent, or other request metadata.
// Each browser keeps the ids it created and lists them by id; the edit
// token issued at creation guards changes (see db/ownership.ts).

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
  if (!countryIds.includes(payload.country_id)) {
    return `country_id must be one of: ${countryIds.join(", ")}`;
  }
  const labelError = invalidText("label", payload.label);
  if (labelError) {
    return labelError;
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

async function handleGET(request: Request): Promise<Response> {
  if (!isFlagshipApiEnabled()) {
    return flagshipApiDisabledResponse();
  }
  if (!isDbConfigured()) {
    return dbUnavailable();
  }

  // A batch read by id; there is no listing by user or of everything.
  const ids = parseIdList(new URL(request.url).searchParams);
  if (!ids) {
    return json(
      {
        error: `ids must list up to ${MAX_IDS_PER_REQUEST} comma-separated reform ids`,
      },
      400,
    );
  }
  if (ids.length === 0) {
    return json([]);
  }

  const rows = await getDb()
    .select()
    .from(reforms)
    .where(inArray(reforms.id, ids))
    .orderBy(desc(reforms.updatedAt));

  return json(rows.map(reformRowToMetadata));
}

async function handlePOST(request: Request): Promise<Response> {
  if (!isFlagshipApiEnabled()) {
    return flagshipApiDisabledResponse();
  }
  if (!isDbConfigured()) {
    return dbUnavailable();
  }

  const parsed = await readJsonBody(request);
  if ("error" in parsed) {
    return json({ error: parsed.error }, parsed.status);
  }
  const payload = parsed.body as ReformCreationMetadata;

  const validationError = validateCreationPayload(payload);
  if (validationError) {
    return json({ error: validationError }, 400);
  }

  const { token, hash } = await issueEditToken();
  const row = await insertWithinBudget(reforms, async (tx) => {
    const [inserted] = await tx
      .insert(reforms)
      .values({
        editTokenHash: hash,
        countryId: payload.country_id,
        label: payload.label ?? null,
        policyId: payload.policy_id ?? null,
        parameters: payload.parameters,
        baseline: payload.baseline,
        provenance: payload.provenance,
      })
      .returning();
    return inserted;
  });
  if (!row) {
    return newRowBudgetResponse();
  }

  // The only time the token leaves the server; the row keeps its hash.
  const created: ReformCreatedMetadata = {
    ...reformRowToMetadata(row),
    edit_token: token,
  };
  return json(created, 201);
}

// A database missing the latest migration answers 503, not 500 (see db/errors).
export async function GET(
  ...args: Parameters<typeof handleGET>
): Promise<Response> {
  return guardSchema(() => handleGET(...args));
}

export async function POST(
  ...args: Parameters<typeof handlePOST>
): Promise<Response> {
  return guardSchema(() => handlePOST(...args));
}
