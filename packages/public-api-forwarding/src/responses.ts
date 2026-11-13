/**
 * Set to "true" on every answer the forwarding package or a route writes
 * itself, never on the Public API's own answers. The error shape is the
 * same, so this is how a caller tells, for example, "the Public API could
 * not be reached" (502, a failed request worth retrying) from the Public
 * API's own 502 for a calculation that failed.
 */
export const ROUTE_ERROR_HEADER = "X-PolicyEngine-Route-Error";

/**
 * A JSON error in the Public API's own error shape, so a caller handles the
 * route's errors and the Public API's errors the same way, marked with
 * ROUTE_ERROR_HEADER. Never cached.
 */
export function errorResponse(
  statusCode: number,
  message: string,
  extraHeaders?: HeadersInit,
): Response {
  const headers = new Headers(extraHeaders);
  headers.set("Content-Type", "application/json");
  headers.set("Cache-Control", "no-store");
  headers.set(ROUTE_ERROR_HEADER, "true");
  return new Response(
    JSON.stringify({ status: "error", message, result: null }),
    { status: statusCode, headers },
  );
}
