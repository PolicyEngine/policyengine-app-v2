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
      responseHeadersTimeoutMilliseconds: 110_000,
    });
  });
}
