// What every dashboard API route does around its operation: refuse other
// sites' pages, answer preflights, read the JSON body, and add the CORS
// headers to every answer.

import {
  checkOrigin,
  corsResponseHeaders,
  errorResponse,
  isJsonMediaType,
  preflightResponse,
} from "@policyengine/public-api-forwarding";

import { DASHBOARD_API_CORS_POLICY } from "./cors";

export type JsonBodyResult =
  | { readonly ok: true; readonly body: unknown }
  | { readonly ok: false; readonly response: Response };

export function dashboardApiPreflight(request: Request): Response {
  return preflightResponse(request, DASHBOARD_API_CORS_POLICY);
}

/**
 * Runs an operation for a request from an allowed origin, giving it the
 * CORS headers its answer must carry. Other sites' pages get 403 and the
 * operation never runs.
 */
export async function handleDashboardApiRequest(
  request: Request,
  operation: (corsHeaders: Headers) => Promise<Response>,
): Promise<Response> {
  const originCheck = checkOrigin(request, DASHBOARD_API_CORS_POLICY);
  if (originCheck.kind === "refused") {
    return errorResponse(
      403,
      "Pages on this origin may not call the dashboard API.",
      { Vary: "Origin" },
    );
  }
  return operation(corsResponseHeaders(originCheck, DASHBOARD_API_CORS_POLICY));
}

/**
 * Reads a JSON request body. The body must be sent as a JSON media type, so
 * another site's page can only send one after a CORS preflight.
 */
export async function readJsonBody(
  request: Request,
  corsHeaders: Headers,
): Promise<JsonBodyResult> {
  if (!isJsonMediaType(request.headers.get("content-type"))) {
    return {
      ok: false,
      response: errorResponse(
        415,
        "Send the request body as application/json.",
        corsHeaders,
      ),
    };
  }
  try {
    return { ok: true, body: await request.json() };
  } catch {
    return {
      ok: false,
      response: errorResponse(
        400,
        "The request body is not valid JSON.",
        corsHeaders,
      ),
    };
  }
}
