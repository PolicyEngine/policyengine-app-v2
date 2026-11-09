// GET /api/economy/compare?country=&policy=&baseline=&region=&year=
// -> the Public API's GET /{country}/economy/{policy}/over/{baseline}
// ?region=&time_period=. The answer is the Public API's {status, result}:
// "computing" until the comparison is ready, so callers poll; then "ok" or
// "error". It is never cached.

import { errorResponse } from "@policyengine/public-api-forwarding";

import {
  dashboardApiPreflight,
  handleDashboardApiRequest,
} from "@/lib/dashboardApi/handler";
import { economyComparison } from "@/lib/dashboardApi/operations";
import { websitePublicApi } from "@/lib/publicApi/forwarder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export function OPTIONS(request: Request): Response {
  return dashboardApiPreflight(request);
}

export async function GET(request: Request): Promise<Response> {
  return handleDashboardApiRequest(request, async (corsHeaders) => {
    const operation = economyComparison(new URL(request.url).searchParams);
    if (!operation.ok) {
      return errorResponse(400, operation.message, corsHeaders);
    }
    return websitePublicApi.forward(operation.request, {
      incomingRequest: request,
      responseHeaders: corsHeaders,
      responseHeadersTimeoutMilliseconds: 50_000,
    });
  });
}
