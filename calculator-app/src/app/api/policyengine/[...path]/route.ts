// app.policyengine.org's own route to the Public API:
// /api/policyengine/{Public API path}, same-origin, so the browser needs no
// CORS and sends no preflights. It forwards only the operations the
// calculator calls (app/src/libs/publicApiRoute/allowList.ts) through the
// shared forwarding package, with the calculator's own server credential
// when one is configured, and answers 404 for any other path or method.
// Like calculator-app/src/app/api/uk-chat/[...path]/route.ts, it is an
// allow-listed proxy, never an open one.
//
// Handlers use Web-standard Request/Response (not next/server): these
// files are also typechecked inside app/tsconfig.json's program.

import {
  checkOrigin,
  corsResponseHeaders,
  createPublicApiForwarder,
  errorResponse,
  isLocalDevelopmentOrigin,
  preflightResponse,
  vercelClientAddress,
  vercelRuntimeTokenStore,
  type CorsPolicy,
} from "@policyengine/public-api-forwarding";

import {
  CACHE_CONTROL,
  FORWARDED_METHODS,
  PUBLIC_API_ROUTE_PREFIX,
  matchAllowedOperation,
} from "@/libs/publicApiRoute/allowList";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// A household calculation can take minutes.
export const maxDuration = 300;

const calculatorPublicApi = createPublicApiForwarder({
  environment: process.env,
  callerName: "policyengine-calculator",
  sharedTokenStore: vercelRuntimeTokenStore(),
  clientAddress: vercelClientAddress,
});

// The calculator's own pages are same-origin. Only local work on another
// port, such as the Vite dev server or Storybook, needs CORS.
const LOCAL_DEVELOPMENT_CORS_POLICY: CorsPolicy = {
  isAllowedOrigin: isLocalDevelopmentOrigin,
  allowedMethods: FORWARDED_METHODS,
  allowedRequestHeaders: [
    "Content-Type",
    "Authorization",
    "PolicyEngine-Unauthenticated-User",
  ],
  exposedResponseHeaders: [
    "Retry-After",
    "X-PolicyEngine-Request-Id",
    "X-PolicyEngine-Observability-Id",
  ],
  preflightMaxAgeSeconds: 600,
};

function isJsonMediaType(contentType: string | null): boolean {
  return (
    (contentType ?? "").split(";")[0].trim().toLowerCase() ===
    "application/json"
  );
}

async function forwardAllowedOperation(request: Request): Promise<Response> {
  const originCheck = checkOrigin(request, LOCAL_DEVELOPMENT_CORS_POLICY);
  if (originCheck.kind === "refused") {
    return errorResponse(403, "Pages on this origin may not call this route.", {
      Vary: "Origin",
    });
  }
  const corsHeaders = corsResponseHeaders(
    originCheck,
    LOCAL_DEVELOPMENT_CORS_POLICY,
  );

  // The raw path, before any decoding, so "%2F" or "%2E" cannot form a new
  // segment that the allow list would then match.
  const requestUrl = new URL(request.url);
  if (!requestUrl.pathname.startsWith(`${PUBLIC_API_ROUTE_PREFIX}/`)) {
    return errorResponse(404, "Unknown route.", corsHeaders);
  }
  const publicApiPath = requestUrl.pathname.slice(
    PUBLIC_API_ROUTE_PREFIX.length,
  );
  const operation = matchAllowedOperation(request.method, publicApiPath);
  if (operation === null) {
    return errorResponse(404, "Unknown route.", corsHeaders);
  }

  let body: string | undefined;
  if (request.method === "POST" || request.method === "PATCH") {
    const bodyText = await request.text();
    if (bodyText !== "") {
      if (!isJsonMediaType(request.headers.get("content-type"))) {
        return errorResponse(
          415,
          "Send the request body as application/json.",
          corsHeaders,
        );
      }
      body = bodyText;
    }
  }

  return calculatorPublicApi.forward(
    {
      method: request.method as (typeof FORWARDED_METHODS)[number],
      path: publicApiPath,
      query: requestUrl.search ? requestUrl.searchParams : undefined,
      body,
    },
    {
      incomingRequest: request,
      responseHeaders: corsHeaders,
      cacheControl: CACHE_CONTROL[operation.cache],
      responseHeadersTimeoutMilliseconds:
        operation.responseHeadersTimeoutMilliseconds,
    },
  );
}

export function OPTIONS(request: Request): Response {
  return preflightResponse(request, LOCAL_DEVELOPMENT_CORS_POLICY);
}

export const GET = forwardAllowedOperation;
export const POST = forwardAllowedOperation;
export const PATCH = forwardAllowedOperation;
export const DELETE = forwardAllowedOperation;
