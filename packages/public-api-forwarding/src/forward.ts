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
import { isJsonMediaType } from "./mediaType";
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
  /** Next.js's fetch options, such as { revalidate: 900 } for its data cache. */
  readonly next?: {
    readonly revalidate?: number | false;
    readonly tags?: string[];
  };
  /** How long to wait for the whole request. */
  readonly timeoutMilliseconds?: number;
}

/**
 * The Public API cannot be called: it is not configured, the server
 * credential cannot be obtained, or the path is not one a route may name.
 * The message is safe to show; details go to the server's log.
 */
export class PublicApiUnavailableError extends Error {
  override name = "PublicApiUnavailableError";

  constructor(
    message: string,
    /** The status a route would answer with for this failure. */
    readonly statusCode: number,
  ) {
    super(message);
  }
}

export interface PublicApiForwarder {
  /** Sends a browser's request on to the Public API and streams the answer. */
  forward(
    request: PublicApiRequest,
    options: ForwardOptions,
  ): Promise<Response>;
  /**
   * Sends a request from the server's own code, not on behalf of a browser:
   * no browser headers, only the server credential when one is configured.
   * Resolves with the Public API's response as it is, whatever its status;
   * throws PublicApiUnavailableError when the request cannot be sent.
   */
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

  type Connection =
    | {
        readonly ok: true;
        readonly upstreamUrl: URL;
        readonly serverToken: string | null;
      }
    | { readonly ok: false; readonly error: PublicApiUnavailableError };

  /** Checks the path, reads the settings and gets the server token. */
  async function connect(
    publicApiRequest: PublicApiRequest,
  ): Promise<Connection> {
    if (!isForwardablePath(publicApiRequest.path)) {
      return {
        ok: false,
        error: new PublicApiUnavailableError("Unknown route.", 404),
      };
    }

    const settingsResult = readPublicApiSettings(forwarderOptions.environment);
    if (!settingsResult.ok) {
      logger.error(
        `Public API forwarding is not configured: ${settingsResult.problem}`,
      );
      return {
        ok: false,
        error: new PublicApiUnavailableError(
          "The Public API is not configured on this deployment.",
          503,
        ),
      };
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
        return {
          ok: false,
          error: new PublicApiUnavailableError(
            "Could not obtain a credential for the Public API.",
            502,
          ),
        };
      }
    }

    const upstreamUrl = new URL(`${settings.baseUrl}${publicApiRequest.path}`);
    if (publicApiRequest.query !== undefined) {
      upstreamUrl.search = publicApiRequest.query.toString();
    }
    return { ok: true, upstreamUrl, serverToken };
  }

  function warnIfCredentialRefused(
    publicApiRequest: PublicApiRequest,
    serverToken: string | null,
    upstream: Response,
  ): void {
    if (
      serverToken !== null &&
      (upstream.status === 401 || upstream.status === 403)
    ) {
      logger.warn(
        `The Public API refused ${publicApiRequest.method} ${publicApiRequest.path} (HTTP ${upstream.status}) although the server credential was sent.`,
      );
    }
  }

  async function forward(
    publicApiRequest: PublicApiRequest,
    forwardOptions: ForwardOptions,
  ): Promise<Response> {
    const extraHeaders = forwardOptions.responseHeaders;
    const { incomingRequest } = forwardOptions;

    const connection = await connect(publicApiRequest);
    if (!connection.ok) {
      return errorResponse(
        connection.error.statusCode,
        connection.error.message,
        extraHeaders,
      );
    }
    const { upstreamUrl, serverToken } = connection;

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
      if (incomingRequest.signal.aborted && !timedOut) {
        // The browser has gone; nobody will read this answer.
        return errorResponse(
          502,
          "The browser closed the request.",
          extraHeaders,
        );
      }
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

    warnIfCredentialRefused(publicApiRequest, serverToken, upstream);
    return browserResponse(upstream, publicApiRequest, forwardOptions, logger);
  }

  async function fetchFromServer(
    publicApiRequest: PublicApiRequest,
    serverOptions: ServerRequestOptions = {},
  ): Promise<Response> {
    const connection = await connect(publicApiRequest);
    if (!connection.ok) {
      throw connection.error;
    }
    const { upstreamUrl, serverToken } = connection;

    const headers = new Headers({
      Accept: "application/json",
      "User-Agent": forwarderOptions.callerName,
    });
    if (publicApiRequest.body !== undefined) {
      headers.set("Content-Type", "application/json");
    }
    if (serverToken !== null) {
      headers.set("Authorization", `Bearer ${serverToken}`);
    }

    const init: RequestInit & { next?: ServerRequestOptions["next"] } = {
      method: publicApiRequest.method,
      headers,
      body: publicApiRequest.body,
      signal: AbortSignal.timeout(
        serverOptions.timeoutMilliseconds ??
          DEFAULT_SERVER_REQUEST_TIMEOUT_MILLISECONDS,
      ),
      // Never followed: a redirect would carry the server credential.
      redirect: "manual",
    };
    if (serverOptions.next !== undefined) {
      init.next = serverOptions.next;
    }
    let upstream: Response;
    try {
      upstream = await fetchImplementation(upstreamUrl, init);
    } catch (error) {
      const timedOut =
        error instanceof DOMException && error.name === "TimeoutError";
      logger.error(
        timedOut
          ? `The Public API did not answer ${publicApiRequest.method} ${publicApiRequest.path} in time.`
          : `Could not reach the Public API for ${publicApiRequest.method} ${publicApiRequest.path}:`,
        error instanceof Error ? error.message : error,
      );
      throw timedOut
        ? new PublicApiUnavailableError(
            "The Public API did not answer in time.",
            504,
          )
        : new PublicApiUnavailableError(
            "The Public API could not be reached.",
            502,
          );
    }
    warnIfCredentialRefused(publicApiRequest, serverToken, upstream);
    return upstream;
  }

  return { forward, fetchFromServer };
}
