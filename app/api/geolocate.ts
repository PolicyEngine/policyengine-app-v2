/**
 * Server-side proxy for ipapi.co geolocation lookups.
 *
 * Keeps the ipapi.co API key server-side (never shipped in the client bundle
 * or exposed via `NEXT_PUBLIC_*` / `VITE_*`). The client calls
 * `/api/geolocate` and receives a plain-text two-letter country code.
 *
 * Environment variables (Vercel):
 *   IPAPI_CO_KEY  optional paid-tier API key. If unset, the free tier is used.
 */

export const config = {
  runtime: "edge",
};

const IPAPI_ENDPOINT = "https://ipapi.co/country_code/";
const TIMEOUT_MS = 1500;

export default async function handler(_request: Request): Promise<Response> {
  const apiKey = process.env.IPAPI_CO_KEY;
  const url = apiKey ? `${IPAPI_ENDPOINT}?key=${apiKey}` : IPAPI_ENDPOINT;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "text/plain" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      return new Response("", {
        status: 502,
        headers: { "Content-Type": "text/plain" },
      });
    }

    const countryCode = (await response.text()).trim().toUpperCase();
    if (!countryCode || countryCode.length !== 2) {
      return new Response("", {
        status: 502,
        headers: { "Content-Type": "text/plain" },
      });
    }

    return new Response(countryCode, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        // Short cache at the edge so the upstream lookup is not repeated
        // for every page load from the same PoP.
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
  } catch {
    return new Response("", {
      status: 502,
      headers: { "Content-Type": "text/plain" },
    });
  }
}
