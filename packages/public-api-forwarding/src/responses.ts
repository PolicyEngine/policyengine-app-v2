/**
 * A JSON error in the Public API's own error shape, so a caller handles the
 * route's errors and the Public API's errors the same way. Never cached.
 */
export function errorResponse(
  statusCode: number,
  message: string,
  extraHeaders?: HeadersInit,
): Response {
  const headers = new Headers(extraHeaders);
  headers.set("Content-Type", "application/json");
  headers.set("Cache-Control", "no-store");
  return new Response(
    JSON.stringify({ status: "error", message, result: null }),
    { status: statusCode, headers },
  );
}
