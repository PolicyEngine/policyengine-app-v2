import type { MigrationRemoteLogPayload } from "../app/src/libs/migration/migrationLogTypes";

const ALLOW_HEADER = "POST";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || isString(value);
}

function isMetadata(value: unknown): boolean {
  if (value === undefined) {
    return true;
  }

  if (!isRecord(value)) {
    return false;
  }

  return Object.values(value).every(
    (entry) =>
      entry === null ||
      typeof entry === "string" ||
      typeof entry === "number" ||
      typeof entry === "boolean",
  );
}

function isMigrationRemoteLogPayload(
  value: unknown,
): value is MigrationRemoteLogPayload {
  if (
    !isRecord(value) ||
    !isString(value.kind) ||
    !isString(value.prefix) ||
    !isString(value.ts)
  ) {
    return false;
  }

  if (!isOptionalString(value.pathname) || !isOptionalString(value.href)) {
    return false;
  }

  if (value.kind === "comparison") {
    return (
      isString(value.operation) &&
      (value.status === "MATCH" || value.status === "DIVERGE") &&
      typeof value.compared === "number" &&
      typeof value.matches === "number" &&
      typeof value.mismatches === "number" &&
      typeof value.skipped === "number" &&
      typeof value.detailCount === "number" &&
      (value.truncatedDetailCount === undefined ||
        typeof value.truncatedDetailCount === "number") &&
      Array.isArray(value.details) &&
      value.details.every(
        (detail) =>
          isRecord(detail) &&
          isString(detail.field) &&
          isString(detail.v1) &&
          isString(detail.v2) &&
          (detail.status === "MATCH" ||
            detail.status === "MISMATCH" ||
            detail.status === "SKIPPED"),
      )
    );
  }

  if (value.kind === "event") {
    return (
      (value.status === "FAILED" || value.status === "SKIPPED") &&
      isString(value.message) &&
      isOptionalString(value.operation) &&
      isMetadata(value.metadata)
    );
  }

  return false;
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: {
        Allow: ALLOW_HEADER,
      },
    });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return new Response("Invalid JSON payload", { status: 400 });
  }

  if (!isMigrationRemoteLogPayload(payload)) {
    return new Response("Invalid migration log payload", { status: 400 });
  }

  console.log(`[MigrationRemoteLog] ${JSON.stringify(payload)}`);

  return new Response(null, {
    status: 204,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
