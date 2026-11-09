// POST /api/policies {country, parameters} -> {id}
// -> the Public API's POST /{country}/policy {data: parameters}. The answer
// is 201 for a new policy and 200 for an identical one stored before.

import { errorResponse } from "@policyengine/public-api-forwarding";

import {
  dashboardApiPreflight,
  handleDashboardApiRequest,
  readJsonBody,
} from "@/lib/dashboardApi/handler";
import { policyCreation } from "@/lib/dashboardApi/operations";
import { websitePublicApi } from "@/lib/publicApi/forwarder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export function OPTIONS(request: Request): Response {
  return dashboardApiPreflight(request);
}

function storedPolicyId(body: unknown): number | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }
  const result = (body as { result?: unknown }).result;
  if (typeof result !== "object" || result === null) {
    return null;
  }
  const policyId = (result as { policy_id?: unknown }).policy_id;
  return typeof policyId === "number" && Number.isInteger(policyId)
    ? policyId
    : null;
}

export async function POST(request: Request): Promise<Response> {
  return handleDashboardApiRequest(request, async (corsHeaders) => {
    const bodyResult = await readJsonBody(request, corsHeaders);
    if (!bodyResult.ok) {
      return bodyResult.response;
    }
    const operation = policyCreation(bodyResult.body);
    if (!operation.ok) {
      return errorResponse(400, operation.message, corsHeaders);
    }
    const forwarded = await websitePublicApi.forward(operation.request, {
      incomingRequest: request,
      responseHeaders: corsHeaders,
      responseHeadersTimeoutMilliseconds: 50_000,
    });
    if (!forwarded.ok) {
      return forwarded;
    }

    // The Public API's answer is small, so it is read and reshaped.
    const policyId = storedPolicyId(await forwarded.json().catch(() => null));
    if (policyId === null) {
      return errorResponse(
        502,
        "The Public API's answer named no policy ID.",
        corsHeaders,
      );
    }
    const headers = new Headers(forwarded.headers);
    headers.set("Content-Type", "application/json");
    return new Response(JSON.stringify({ id: policyId }), {
      status: forwarded.status,
      headers,
    });
  });
}
