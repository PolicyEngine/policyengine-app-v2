// Cross-origin rules for the routes that forward to the Public API.
//
// CORS only stops other sites' pages from reading a response; it does not
// stop a request from running. So a request whose Origin is neither the
// route's own site nor an allowed one is refused outright (403) before it
// reaches the Public API.

export interface CorsPolicy {
  /** Whether a page at this origin, other than the route's own, may call it. */
  readonly isAllowedOrigin: (origin: URL) => boolean;
  readonly allowedMethods: readonly string[];
  readonly allowedRequestHeaders: readonly string[];
  readonly exposedResponseHeaders: readonly string[];
  readonly preflightMaxAgeSeconds: number;
}

export type OriginCheck =
  | { readonly kind: "no-origin" }
  | { readonly kind: "same-origin" }
  | { readonly kind: "allowed"; readonly origin: string }
  | { readonly kind: "refused" };

const LOCAL_DEVELOPMENT_HOST_NAMES = new Set(["localhost", "127.0.0.1"]);

/** http://localhost and http://127.0.0.1, on any port. */
export function isLocalDevelopmentOrigin(origin: URL): boolean {
  return (
    origin.protocol === "http:" &&
    LOCAL_DEVELOPMENT_HOST_NAMES.has(origin.hostname)
  );
}

function ownHosts(request: Request): Set<string> {
  const hosts = new Set<string>([new URL(request.url).host]);
  for (const headerName of ["x-forwarded-host", "host"]) {
    const value = request.headers.get(headerName);
    if (value) {
      hosts.add(value.split(",")[0].trim().toLowerCase());
    }
  }
  return hosts;
}

export function checkOrigin(request: Request, policy: CorsPolicy): OriginCheck {
  const originHeader = request.headers.get("origin");
  if (originHeader === null) {
    return { kind: "no-origin" };
  }

  let origin: URL;
  try {
    origin = new URL(originHeader);
  } catch {
    // Includes "null", which sandboxed frames and local files send.
    return { kind: "refused" };
  }
  if (origin.origin !== originHeader) {
    return { kind: "refused" };
  }
  if (ownHosts(request).has(origin.host)) {
    return { kind: "same-origin" };
  }
  return policy.isAllowedOrigin(origin)
    ? { kind: "allowed", origin: origin.origin }
    : { kind: "refused" };
}

/** Headers for a response to an actual (not preflight) request. */
export function corsResponseHeaders(
  check: OriginCheck,
  policy: CorsPolicy,
): Headers {
  // Every answer varies by Origin, so no cache hands one origin's answer
  // to another.
  const headers = new Headers({ Vary: "Origin" });
  if (check.kind === "allowed") {
    headers.set("Access-Control-Allow-Origin", check.origin);
    if (policy.exposedResponseHeaders.length > 0) {
      headers.set(
        "Access-Control-Expose-Headers",
        policy.exposedResponseHeaders.join(", "),
      );
    }
  }
  return headers;
}

/** The answer to an OPTIONS preflight request. */
export function preflightResponse(
  request: Request,
  policy: CorsPolicy,
): Response {
  const check = checkOrigin(request, policy);
  if (check.kind === "refused") {
    return new Response(null, {
      status: 403,
      headers: { Vary: "Origin", "Cache-Control": "no-store" },
    });
  }
  const headers = corsResponseHeaders(check, policy);
  headers.set("Allow", [...policy.allowedMethods, "OPTIONS"].join(", "));
  if (check.kind === "allowed") {
    headers.set(
      "Access-Control-Allow-Methods",
      [...policy.allowedMethods, "OPTIONS"].join(", "),
    );
    headers.set(
      "Access-Control-Allow-Headers",
      policy.allowedRequestHeaders.join(", "),
    );
    headers.set(
      "Access-Control-Max-Age",
      String(policy.preflightMaxAgeSeconds),
    );
  }
  return new Response(null, { status: 204, headers });
}
