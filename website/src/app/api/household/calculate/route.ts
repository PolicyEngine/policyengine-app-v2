// POST /api/household/calculate {country, household, policy?}
// -> API v1's POST /v2/household-calculations, then
// GET /v2/household-calculations/{calculation_id} until the calculation
// finishes. The answer is the one API v1's POST /{country}/calculate gave,
// {status, message, result}, so the dashboards see no change. API v1 keeps
// the calculation as a household job only: no stored household or policy.

import { errorResponse } from "@policyengine/public-api-forwarding";

import {
  dashboardApiPreflight,
  handleDashboardApiRequest,
  readJsonBody,
} from "@/lib/dashboardApi/handler";
import { householdCalculationAnswer } from "@/lib/dashboardApi/householdCalculationAnswer";
import { householdCalculation } from "@/lib/dashboardApi/operations";
import { websiteHouseholdCalculator } from "@/lib/publicApi/householdCalculator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// A household with many people, several years or a variation chart can take
// minutes, and a submission may first wait for an API v1 instance to start.
// The route may run for 800 s, Vercel Pro's limit on Fluid compute: reading
// the request, the helper's 10-minute limit on a calculation
// (HOUSEHOLD_CALCULATION_TIME_LIMIT_MILLISECONDS), up to about 80 s after it
// for the last requests and their tokens, and then the streamed answer.
// website/vercel.json turns on Vercel's request cancellation for this route,
// so a browser that goes away stops the function, and with it the
// calculation's reads, rather than holding the function for that long.
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
    return householdCalculationAnswer(
      websiteHouseholdCalculator,
      operation.request,
      { incomingRequest: request, responseHeaders: corsHeaders },
    );
  });
}
