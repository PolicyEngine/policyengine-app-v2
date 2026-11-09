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

export function isLocalDevelopmentOrigin(_origin: URL): boolean {
  return false;
}

export function checkOrigin(
  _request: Request,
  _policy: CorsPolicy,
): OriginCheck {
  return { kind: "no-origin" };
}

export function corsResponseHeaders(
  _check: OriginCheck,
  _policy: CorsPolicy,
): Headers {
  return new Headers();
}

export function preflightResponse(
  _request: Request,
  _policy: CorsPolicy,
): Response {
  return new Response(null, { status: 501 });
}
