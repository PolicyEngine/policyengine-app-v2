// GET /api/metadata/{country} -> the Public API's GET /{country}/metadata.
//
// The document is tens of megabytes before compression, above the 10 MB
// Vercel's CDN caches and the 4.5 MB a buffered function answer may hold,
// so it is streamed and cached by browsers only, for an hour.

import { errorResponse } from "@policyengine/public-api-forwarding";

import {
  dashboardApiPreflight,
  handleDashboardApiRequest,
} from "@/lib/dashboardApi/handler";
import {
  METADATA_CACHE_CONTROL,
  countryMetadata,
} from "@/lib/dashboardApi/operations";
import { websitePublicApi } from "@/lib/publicApi/forwarder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export function OPTIONS(request: Request): Response {
  return dashboardApiPreflight(request);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ country: string }> },
): Promise<Response> {
  const { country } = await params;
  return handleDashboardApiRequest(request, async (corsHeaders) => {
    const operation = countryMetadata(country);
    if (!operation.ok) {
      return errorResponse(404, operation.message, corsHeaders);
    }
    return websitePublicApi.forward(operation.request, {
      incomingRequest: request,
      responseHeaders: corsHeaders,
      cacheControl: METADATA_CACHE_CONTROL,
      responseHeadersTimeoutMilliseconds: 60_000,
    });
  });
}
