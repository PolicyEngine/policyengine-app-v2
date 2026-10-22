/**
 * The visitor's country, for the root page's choice between /us, /uk and
 * the other country routes.
 *
 * Vercel adds an `x-vercel-ip-country` header to every request it receives
 * from a client: the ISO 3166-1 alpha-2 code of the country of the client's
 * IP address. This route returns that code as plain text, such as "GB",
 * and makes no outbound request.
 *
 * The route must be served by the project the browser calls. Vercel derives
 * the header from the address of the client connected to it, so after a
 * rewrite to another deployment the header would describe the proxy rather
 * than the visitor.
 *
 * When the header is missing (local development, `next start`) or is not a
 * two-letter code, the route responds 204 with an empty body, and the client
 * falls back to the browser's language setting.
 *
 * The response differs between visitors, so no shared cache may store it.
 */

export const dynamic = "force-dynamic";

const COUNTRY_HEADER = "x-vercel-ip-country";
const COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/;

const RESPONSE_HEADERS = {
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "private, no-store",
};

export function GET(request: Request): Response {
  const countryCode = (request.headers.get(COUNTRY_HEADER) ?? "")
    .trim()
    .toUpperCase();

  if (!COUNTRY_CODE_PATTERN.test(countryCode)) {
    return new Response(null, { status: 204, headers: RESPONSE_HEADERS });
  }

  return new Response(countryCode, {
    status: 200,
    headers: RESPONSE_HEADERS,
  });
}
