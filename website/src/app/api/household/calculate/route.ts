// POST /api/household/calculate {country, household, policy?}
// -> the Public API's POST /{country}/calculate. The answer is the Public
// API's {status, message, result}, streamed back unchanged.

import { errorResponse } from "@policyengine/public-api-forwarding";

import {
  dashboardApiPreflight,
  handleDashboardApiRequest,
  readJsonBody,
} from "@/lib/dashboardApi/handler";
import { householdCalculation } from "@/lib/dashboardApi/operations";
import { websitePublicApi } from "@/lib/publicApi/forwarder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// A household with many people or a variation chart can take over a minute.
// The Public API gets 100 s to answer, after up to 10 s for a token, so the
// route's own JSON 504 arrives before Vercel ends the function.
export const maxDuration = 120;

export function OPTIONS(request: Request): Response {
  return dashboardApiPreflight(request);
}

export async function POST(request: Request): Promise<Response> {
  return handleDashboardApiRequest(request, async (corsHeaders) => {
    const bodyResult = await readJsonBody(request, corsHeaders);
    if (!bodyResult.ok) {
      return bodyResult.response;
    }
    const operation = householdCalculation(bodyResult.body);
    if (!operation.ok) {
      return errorResponse(400, operation.message, corsHeaders);
    }
    return websitePublicApi.forward(operation.request, {
      incomingRequest: request,
      responseHeaders: corsHeaders,
      responseHeadersTimeoutMilliseconds: 100_000,
    });
  });
}
