// Sends one request to the Public API on behalf of a browser, from a route
// handler, and streams the answer back.
//
// Uses only Web-standard Request, Response and fetch, so the module works in
// any Next.js route handler and in calculator-app files that app/'s
// TypeScript program also checks.

import {
  createAccessTokenProvider,
  type AccessTokenProvider,
  type ForwardingLogger,
  type SharedTokenStore,
} from "./accessToken";
import { errorResponse } from "./responses";
import { readPublicApiSettings, type EnvironmentVariables } from "./settings";

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

export interface ServerRequestOptions {
  readonly next?: {
    readonly revalidate?: number | false;
    readonly tags?: string[];
  };
  readonly timeoutMilliseconds?: number;
}

export class PublicApiUnavailableError extends Error {
  override name = "PublicApiUnavailableError";

  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
  }
}

export interface PublicApiForwarder {
  forward(
    request: PublicApiRequest,
    options: ForwardOptions,
  ): Promise<Response>;
  fetchFromServer(
    request: PublicApiRequest,
    options?: ServerRequestOptions,
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
export const DEFAULT_SERVER_REQUEST_TIMEOUT_MILLISECONDS = 30_000;

export const USER_AUTHORIZATION_HEADER = "PolicyEngine-User-Authorization";
export const UNAUTHENTICATED_USER_HEADER = "PolicyEngine-Unauthenticated-User";

// The only Public API response headers a browser sees. Content-Encoding and
// Content-Length are left out on purpose: fetch has already decompressed the
// body, so the Public API's values no longer describe it.
const FORWARDED_RESPONSE_HEADERS = [
  "content-type",
  "etag",
  "last-modified",
  "retry-after",
  "www-authenticate",
  "x-policyengine-request-id",
  "x-policyengine-observability-id",
] as const;

// Path segments are letters, digits, "-", "_", "." and "~", and never "." or
// "..", so a path can only name a route on the configured Public API.
const PATH_SEGMENT_PATTERN = /^[A-Za-z0-9._~-]+$/;

export function isForwardablePath(path: string): boolean {
  if (!path.startsWith("/") || path.length < 2) {
    return false;
  }
  return path
    .slice(1)
    .split("/")
    .every(
      (segment) =>
        PATH_SEGMENT_PATTERN.test(segment) &&
        segment !== "." &&
        segment !== "..",
    );
}

function isJsonMediaType(contentType: string | null): boolean {
  if (contentType === null) {
    return false;
  }
  const mediaType = contentType.split(";")[0].trim().toLowerCase();
  return mediaType === "application/json" || mediaType.endsWith("+json");
}

function upstreamHeaders(
  incomingRequest: Request,
  publicApiRequest: PublicApiRequest,
  serverToken: string | null,
  callerName: string,
  clientAddress: string | undefined,
): Headers {
  // Built from nothing: the browser's cookies, Origin, Referer and every
  // other header stay behind.
  const headers = new Headers();
  headers.set("Accept", "application/json");
  headers.set("User-Agent", callerName);
  if (publicApiRequest.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const userAuthorization = incomingRequest.headers.get("authorization");
  if (serverToken !== null) {
    headers.set("Authorization", `Bearer ${serverToken}`);
    if (userAuthorization) {
      headers.set(USER_AUTHORIZATION_HEADER, userAuthorization);
    }
  } else if (userAuthorization) {
    // Without a server credential, the Public API still reads the user's
    // token from Authorization, as it does for a direct browser call.
    headers.set("Authorization", userAuthorization);
  }

  const unauthenticatedUser = incomingRequest.headers.get(
    UNAUTHENTICATED_USER_HEADER,
  );
  if (unauthenticatedUser) {
    headers.set(UNAUTHENTICATED_USER_HEADER, unauthenticatedUser);
  }

  if (publicApiRequest.method === "GET" || publicApiRequest.method === "HEAD") {
    for (const conditionalHeader of ["if-none-match", "if-modified-since"]) {
      const value = incomingRequest.headers.get(conditionalHeader);
      if (value) {
        headers.set(conditionalHeader, value);
      }
    }
  }

  const address = clientAddress?.trim();
  if (address) {
    headers.set("X-Forwarded-For", address);
  }
  return headers;
}

async function discardBody(response: Response): Promise<void> {
  try {
    await response.body?.cancel();
  } catch {
    // The body is not needed; a failure to cancel it changes nothing.
  }
}

async function browserResponse(
  upstream: Response,
  publicApiRequest: PublicApiRequest,
  forwardOptions: ForwardOptions,
  logger: ForwardingLogger,
): Promise<Response> {
  const statusCode = upstream.status;
  const extraHeaders = forwardOptions.responseHeaders;

  if (statusCode >= 300 && statusCode < 400 && statusCode !== 304) {
    await discardBody(upstream);
    logger.error(
      `The Public API answered ${publicApiRequest.method} ${publicApiRequest.path} with a redirect (HTTP ${statusCode}).`,
    );
    return errorResponse(
      502,
      "The Public API answered with a redirect.",
      extraHeaders,
    );
  }

  if (statusCode >= 500) {
    logger.error(
      `The Public API answered ${publicApiRequest.method} ${publicApiRequest.path} with HTTP ${statusCode}.`,
    );
  }

  const headers = new Headers(extraHeaders);
  for (const headerName of FORWARDED_RESPONSE_HEADERS) {
    const value = upstream.headers.get(headerName);
    if (value !== null) {
      headers.set(headerName, value);
    }
  }

  // Errors from in front of the Public API, such as the load balancer's or
  // the rate limiter's, are not JSON; give the caller JSON with the same
  // status instead.
  if (
    statusCode >= 400 &&
    !isJsonMediaType(upstream.headers.get("content-type"))
  ) {
    await discardBody(upstream);
    headers.delete("content-type");
    return errorResponse(
      statusCode,
      `The Public API answered HTTP ${statusCode}.`,
      headers,
    );
  }

  const isCacheable = statusCode < 300 || statusCode === 304;
  headers.set(
    "Cache-Control",
    isCacheable && forwardOptions.cacheControl
      ? forwardOptions.cacheControl
      : "no-store",
  );

  const hasNoBody =
    statusCode === 204 ||
    statusCode === 304 ||
    publicApiRequest.method === "HEAD";
  if (hasNoBody) {
    await discardBody(upstream);
  }
  // Streamed, not buffered: Vercel caps buffered function responses at
  // 4.5 MB, and country metadata is far larger.
  return new Response(hasNoBody ? null : upstream.body, {
    status: statusCode,
    headers,
  });
}

export function createPublicApiForwarder(
  forwarderOptions: PublicApiForwarderOptions,
): PublicApiForwarder {
  const fetchImplementation: typeof fetch =
    forwarderOptions.fetchImplementation ??
    ((input, init) => globalThis.fetch(input, init));
  const logger = forwarderOptions.logger ?? console;
  const getAccessToken: AccessTokenProvider = createAccessTokenProvider({
    sharedStore: forwarderOptions.sharedTokenStore,
    fetchImplementation,
    now: forwarderOptions.now ?? Date.now,
    logger,
  });

  async function forward(
    publicApiRequest: PublicApiRequest,
    forwardOptions: ForwardOptions,
  ): Promise<Response> {
    const extraHeaders = forwardOptions.responseHeaders;
    const { incomingRequest } = forwardOptions;

    if (!isForwardablePath(publicApiRequest.path)) {
      return errorResponse(404, "Unknown route.", extraHeaders);
    }

    const settingsResult = readPublicApiSettings(forwarderOptions.environment);
    if (!settingsResult.ok) {
      logger.error(
        `Public API forwarding is not configured: ${settingsResult.problem}`,
      );
      return errorResponse(503, "This route is not configured.", extraHeaders);
    }
    const { settings } = settingsResult;

    let serverToken: string | null = null;
    if (settings.credential !== null) {
      try {
        serverToken = await getAccessToken(settings.credential);
      } catch (error) {
        logger.error(
          "Could not obtain a Public API access token:",
          error instanceof Error ? error.message : error,
        );
        return errorResponse(
          502,
          "Could not obtain a credential for the Public API.",
          extraHeaders,
        );
      }
    }

    const upstreamUrl = new URL(`${settings.baseUrl}${publicApiRequest.path}`);
    if (publicApiRequest.query !== undefined) {
      upstreamUrl.search = publicApiRequest.query.toString();
    }

    const abortController = new AbortController();
    let timedOut = false;
    const timeoutTimer = setTimeout(() => {
      timedOut = true;
      abortController.abort();
    }, forwardOptions.responseHeadersTimeoutMilliseconds ?? DEFAULT_RESPONSE_HEADERS_TIMEOUT_MILLISECONDS);
    // A browser that goes away stops the upstream request, including a
    // response that is still streaming.
    const abortForDisconnectedBrowser = () => abortController.abort();
    if (incomingRequest.signal.aborted) {
      abortController.abort();
    } else {
      incomingRequest.signal.addEventListener(
        "abort",
        abortForDisconnectedBrowser,
        { once: true },
      );
    }

    let upstream: Response;
    try {
      upstream = await fetchImplementation(upstreamUrl, {
        method: publicApiRequest.method,
        headers: upstreamHeaders(
          incomingRequest,
          publicApiRequest,
          serverToken,
          forwarderOptions.callerName,
          forwarderOptions.clientAddress(incomingRequest),
        ),
        body: publicApiRequest.body,
        signal: abortController.signal,
        // Never followed: a redirect would carry the server credential.
        redirect: "manual",
        // Next.js would otherwise decide for itself whether to keep the
        // answer in its data cache.
        cache: "no-store",
      });
    } catch (error) {
      incomingRequest.signal.removeEventListener(
        "abort",
        abortForDisconnectedBrowser,
      );
      if (timedOut) {
        logger.error(
          `The Public API did not answer ${publicApiRequest.method} ${publicApiRequest.path} in time.`,
        );
        return errorResponse(
          504,
          "The Public API did not answer in time.",
          extraHeaders,
        );
      }
      logger.error(
        `Could not reach the Public API for ${publicApiRequest.method} ${publicApiRequest.path}:`,
        error instanceof Error ? error.message : error,
      );
      return errorResponse(
        502,
        "The Public API could not be reached.",
        extraHeaders,
      );
    } finally {
      clearTimeout(timeoutTimer);
    }

    if (
      serverToken !== null &&
      (upstream.status === 401 || upstream.status === 403)
    ) {
      logger.warn(
        `The Public API refused ${publicApiRequest.method} ${publicApiRequest.path} (HTTP ${upstream.status}) although the server credential was sent.`,
      );
    }

    return browserResponse(upstream, publicApiRequest, forwardOptions, logger);
  }

  // Placeholder until the implementation commit.
  const fetchFromServer = async () => new Response(null, { status: 501 });

  return { forward, fetchFromServer };
}
