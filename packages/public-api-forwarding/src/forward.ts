// Sends one request to the Public API on behalf of a browser, from a route
// handler, and streams the answer back.
//
// Uses only Web-standard Request, Response and fetch, so the module works in
// any Next.js route handler and in calculator-app files that app/'s
// TypeScript program also checks.

import type { ForwardingLogger, SharedTokenStore } from "./accessToken";
import type { EnvironmentVariables } from "./settings";

export type PublicApiMethod =
  | "GET"
  | "HEAD"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE";

export interface PublicApiRequest {
  readonly method: PublicApiMethod;
  /**
   * The Public API path, such as "/us/calculate". The calling route has
   * already checked it against its allow list.
   */
  readonly path: string;
  readonly query?: URLSearchParams;
  /** A JSON request body. */
  readonly body?: string;
}

export interface ForwardOptions {
  /** The browser's request, whose headers carry the user's identity. */
  readonly incomingRequest: Request;
  /**
   * Cache-Control for a successful (2xx) or 304 answer. Every other answer,
   * and every answer when this is omitted, gets "no-store".
   */
  readonly cacheControl?: string;
  /** How long to wait for the Public API's response headers. */
  readonly responseHeadersTimeoutMilliseconds?: number;
  /** Headers added to every response, such as CORS headers. */
  readonly responseHeaders?: HeadersInit;
}

export interface PublicApiForwarder {
  forward(
    request: PublicApiRequest,
    options: ForwardOptions,
  ): Promise<Response>;
}

export interface PublicApiForwarderOptions {
  /** Usually process.env, read on every request. */
  readonly environment: EnvironmentVariables;
  /** Sent as the User-Agent, so the Public API's logs name the caller. */
  readonly callerName: string;
  readonly sharedTokenStore: SharedTokenStore | null;
  /** The browser's IP address, sent to the Public API as X-Forwarded-For. */
  readonly clientAddress: (request: Request) => string | undefined;
  readonly fetchImplementation?: typeof fetch;
  readonly now?: () => number;
  readonly logger?: ForwardingLogger;
}

export const DEFAULT_RESPONSE_HEADERS_TIMEOUT_MILLISECONDS = 60_000;

export const USER_AUTHORIZATION_HEADER = "PolicyEngine-User-Authorization";
export const UNAUTHENTICATED_USER_HEADER = "PolicyEngine-Unauthenticated-User";

export function isForwardablePath(_path: string): boolean {
  return false;
}

export function createPublicApiForwarder(
  _forwarderOptions: PublicApiForwarderOptions,
): PublicApiForwarder {
  return { forward: async () => new Response(null, { status: 501 }) };
}
