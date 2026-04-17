/**
 * Server-side proxy for ipapi.co geolocation lookups.
 *
 * Keeps the ipapi.co API key server-side (never shipped in the client bundle
 * or exposed via `NEXT_PUBLIC_*` / `VITE_*`). The client calls
 * `/api/geolocate` and receives a plain-text two-letter country code.
 *
 * Deployed as part of the Next.js website project, served at
 * `policyengine.org/api/geolocate`. The calculator-app and legacy calculator
 * Vercel projects rewrite `/api/geolocate` to this origin so there is a
 * single source of truth for the API key.
 *
 * Environment variables (Vercel):
 *   IPAPI_CO_KEY  optional paid-tier API key. If unset, the free tier is used.
 */

import { NextResponse } from "next/server";

export const runtime = "edge";

const IPAPI_ENDPOINT = "https://ipapi.co/country_code/";
const TIMEOUT_MS = 1500;

function textResponse(
  body: string,
  status: number,
  extraHeaders: Record<string, string> = {},
): NextResponse {
  return new NextResponse(body, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      ...extraHeaders,
    },
  });
}

export async function GET(): Promise<NextResponse> {
  const apiKey = process.env.IPAPI_CO_KEY;
  const url = apiKey ? `${IPAPI_ENDPOINT}?key=${apiKey}` : IPAPI_ENDPOINT;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "text/plain" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      return textResponse("", 502);
    }

    const countryCode = (await response.text()).trim().toUpperCase();
    if (!countryCode || countryCode.length !== 2) {
      return textResponse("", 502);
    }

    return textResponse(countryCode, 200, {
      // Short cache at the edge so the upstream lookup is not repeated
      // for every page load from the same PoP.
      "Cache-Control": "public, max-age=300, s-maxage=300",
    });
  } catch {
    return textResponse("", 502);
  }
}
