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
  errorResponse,
  isJsonMediaType,
  ROUTE_ERROR_HEADER,
  isLocalDevelopmentOrigin,
  preflightResponse,
  type CorsPolicy,
} from "@policyengine/public-api-forwarding";

import {
  CACHE_CONTROL,
  FORWARDED_METHODS,
  PUBLIC_API_WAIT_MILLISECONDS,
  PUBLIC_API_ROUTE_PREFIX,
  matchAllowedOperation,
} from "@/libs/publicApiRoute/allowList";

import { calculatorPublicApi } from "../../calculatorPublicApi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// A household calculation, or any answer from a starting Public API
// instance, can take minutes. The route may run for 800 s, Vercel Pro's
// standard limit on Fluid compute: a token request of up to 10 s, a wait of
// up to 750 s (PUBLIC_API_WAIT_MILLISECONDS) and then the streamed answer.
// calculator-app/vercel.json turns on Vercel's request cancellation for
// this route, so a browser that goes away stops the function and its
// request to the Public API, rather than holding them for that long.
// Cancellation applies to every method: a write the browser has fully sent
// is dropped if the browser goes away before the route forwards it, which
// is usually milliseconds and at most the token request. Browsers calling
// the Public API directly had no such window.
export const maxDuration = 800;

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
    ROUTE_ERROR_HEADER,
  ],
  preflightMaxAgeSeconds: 600,
};

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
      responseHeadersTimeoutMilliseconds: PUBLIC_API_WAIT_MILLISECONDS,
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
