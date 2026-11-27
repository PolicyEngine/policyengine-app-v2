// POST /api/household/calculate {country, household, policy?}
// -> the Public API's POST /{country}/calculate. The answer is the Public
// API's {status, message, result}, streamed back unchanged.

import { errorResponse } from "@policyengine/public-api-forwarding";

import {
  dashboardApiPreflight,
  handleDashboardApiRequest,
  readJsonBody,
} from "@/lib/dashboardApi/handler";
import {
  HOUSEHOLD_CALCULATION_WAIT_MILLISECONDS,
  householdCalculation,
} from "@/lib/dashboardApi/operations";
import { websitePublicApi } from "@/lib/publicApi/forwarder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// A household with many people, several years or a variation chart can take
// minutes, and a request may first wait for a Public API instance to start.
// The route may run for 800 s, Vercel Pro's limit on Fluid compute: reading
// the request and getting a token (its Auth0 request is limited to 10 s; the
// Runtime Cache reads and writes around it are not), a wait of up to 750 s
// (HOUSEHOLD_CALCULATION_WAIT_MILLISECONDS) and then the streamed answer.
// website/vercel.json turns on Vercel's request cancellation for this route,
// so a browser that goes away stops the function, which closes its
// connection to the Public API, rather than holding both for that long.
export const maxDuration = 800;

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
      responseHeadersTimeoutMilliseconds:
        HOUSEHOLD_CALCULATION_WAIT_MILLISECONDS,
    });
  });
}
