import { beforeEach, describe, expect, test, vi } from "vitest";

import {
  createPublicApiForwarder,
  isForwardablePath,
  type PublicApiRequest,
} from "../src/forward";
import {
  BROWSER_ADDRESS,
  PREVIEW_ENVIRONMENT_WITHOUT_CREDENTIAL,
  PREVIEW_ENVIRONMENT_WITH_CREDENTIAL,
  SERVER_ACCESS_TOKEN,
  STAGING_PUBLIC_API_URL,
  START_TIME_MILLISECONDS,
  UNAUTHENTICATED_USER_ID,
  USER_ACCESS_TOKEN,
  createFakeSharedStore,
  isTokenRequest,
  jsonResponse,
  silentLogger,
  tokenResponse,
} from "./fixtures";

const CALCULATE_REQUEST: PublicApiRequest = {
  method: "POST",
  path: "/us/calculate",
  body: JSON.stringify({ household: {}, policy: {} }),
};

const METADATA_REQUEST: PublicApiRequest = {
  method: "GET",
  path: "/us/metadata",
};

const CALCULATION_RESULT = { status: "ok", message: null, result: {} };

interface ForwarderSetup {
  environment?: Record<string, string>;
  publicApiAnswer?: () => Response | Promise<Response>;
  tokenAnswer?: () => Response | Promise<Response>;
}

function forwarderWith({
  environment = PREVIEW_ENVIRONMENT_WITH_CREDENTIAL,
  publicApiAnswer = () => jsonResponse(CALCULATION_RESULT),
  tokenAnswer = () => tokenResponse(),
}: ForwarderSetup = {}) {
  const fetchImplementation = vi.fn(
    async (input: RequestInfo | URL, _init?: RequestInit) =>
      isTokenRequest(input) ? tokenAnswer() : publicApiAnswer(),
  );
  const forwarder = createPublicApiForwarder({
    environment,
    callerName: "policyengine-test-caller",
    sharedTokenStore: createFakeSharedStore(),
    clientAddress: () => BROWSER_ADDRESS,
    fetchImplementation,
    now: () => START_TIME_MILLISECONDS,
    logger: silentLogger,
  });
  const publicApiCalls = () =>
    fetchImplementation.mock.calls.filter(([input]) => !isTokenRequest(input));
  const onlyPublicApiCall = () => {
    const calls = publicApiCalls();
    expect(calls).toHaveLength(1);
    return calls[0];
  };
  return { forwarder, fetchImplementation, publicApiCalls, onlyPublicApiCall };
}

function browserRequest(headers: Record<string, string> = {}): Request {
  return new Request("https://www.example.test/api/household/calculate", {
    method: "POST",
    headers,
  });
}

function sentHeaders(call: [RequestInfo | URL, RequestInit?]): Headers {
  return new Headers(call[1]?.headers);
}

describe("createPublicApiForwarder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("given a configured credential then it sends the server token in Authorization", async () => {
    // Given
    const { forwarder, onlyPublicApiCall } = forwarderWith();

    // When
    await forwarder.forward(CALCULATE_REQUEST, {
      incomingRequest: browserRequest(),
    });

    // Then
    expect(sentHeaders(onlyPublicApiCall()).get("authorization")).toBe(
      `Bearer ${SERVER_ACCESS_TOKEN}`,
    );
  });

  test("given a configured credential and a signed-in user then it moves the user's token to PolicyEngine-User-Authorization", async () => {
    // Given
    const { forwarder, onlyPublicApiCall } = forwarderWith();

    // When
    await forwarder.forward(CALCULATE_REQUEST, {
      incomingRequest: browserRequest({
        Authorization: `Bearer ${USER_ACCESS_TOKEN}`,
      }),
    });

    // Then
    const headers = sentHeaders(onlyPublicApiCall());
    expect(headers.get("authorization")).toBe(`Bearer ${SERVER_ACCESS_TOKEN}`);
    expect(headers.get("policyengine-user-authorization")).toBe(
      `Bearer ${USER_ACCESS_TOKEN}`,
    );
  });

  test("given no credential configured then it forwards without one and leaves the user's token in Authorization", async () => {
    // Given
    const { forwarder, fetchImplementation, onlyPublicApiCall } = forwarderWith(
      {
        environment: PREVIEW_ENVIRONMENT_WITHOUT_CREDENTIAL,
      },
    );

    // When
    const response = await forwarder.forward(CALCULATE_REQUEST, {
      incomingRequest: browserRequest({
        Authorization: `Bearer ${USER_ACCESS_TOKEN}`,
      }),
    });

    // Then
    expect(response.status).toBe(200);
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
    const headers = sentHeaders(onlyPublicApiCall());
    expect(headers.get("authorization")).toBe(`Bearer ${USER_ACCESS_TOKEN}`);
    expect(headers.get("policyengine-user-authorization")).toBeNull();
  });

  test("given a browser request then it sends only the allowed headers: no cookies, Origin or a browser-supplied user header", async () => {
    // Given
    const { forwarder, onlyPublicApiCall } = forwarderWith();

    // When
    await forwarder.forward(CALCULATE_REQUEST, {
      incomingRequest: browserRequest({
        Cookie: "appSession=secret-session",
        Origin: "https://www.example.test",
        Referer: "https://www.example.test/us/some-dashboard",
        "PolicyEngine-User-Authorization": "Bearer forged-user-token",
        "PolicyEngine-Unauthenticated-User": UNAUTHENTICATED_USER_ID,
        "X-Forwarded-For": "198.51.100.1",
      }),
    });

    // Then
    expect(Object.fromEntries(sentHeaders(onlyPublicApiCall()))).toEqual({
      accept: "application/json",
      authorization: `Bearer ${SERVER_ACCESS_TOKEN}`,
      "content-type": "application/json",
      "policyengine-unauthenticated-user": UNAUTHENTICATED_USER_ID,
      "user-agent": "policyengine-test-caller",
      "x-forwarded-for": BROWSER_ADDRESS,
    });
  });

  test("given a request then it calls the configured Public API path and never follows redirects", async () => {
    // Given
    const { forwarder, onlyPublicApiCall } = forwarderWith();

    // When
    await forwarder.forward(
      {
        method: "GET",
        path: "/us/economy/12/over/2",
        query: new URLSearchParams({ region: "us", time_period: "2026" }),
      },
      { incomingRequest: browserRequest() },
    );

    // Then
    const [requestUrl, requestInit] = onlyPublicApiCall();
    expect(String(requestUrl)).toBe(
      `${STAGING_PUBLIC_API_URL}/us/economy/12/over/2?region=us&time_period=2026`,
    );
    expect(requestInit?.redirect).toBe("manual");
  });

  test("given a successful answer then it streams the body back with the route's Cache-Control and no upstream encoding headers", async () => {
    // Given
    const { forwarder } = forwarderWith({
      publicApiAnswer: () =>
        jsonResponse(CALCULATION_RESULT, 200, {
          "Content-Encoding": "gzip",
          "Content-Length": "123",
          "Set-Cookie": "upstream=1",
          ETag: '"metadata-version"',
        }),
    });

    // When
    const response = await forwarder.forward(METADATA_REQUEST, {
      incomingRequest: browserRequest(),
      cacheControl: "max-age=3600",
    });

    // Then
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(CALCULATION_RESULT);
    expect(response.headers.get("cache-control")).toBe("max-age=3600");
    expect(response.headers.get("etag")).toBe('"metadata-version"');
    expect(response.headers.get("content-encoding")).toBeNull();
    expect(response.headers.get("content-length")).toBeNull();
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  test("given an error answer then it is never cached even when the route asks for caching", async () => {
    // Given
    const { forwarder } = forwarderWith({
      publicApiAnswer: () =>
        jsonResponse({ status: "error", message: "Invalid household" }, 400),
    });

    // When
    const response = await forwarder.forward(METADATA_REQUEST, {
      incomingRequest: browserRequest(),
      cacheControl: "max-age=3600",
    });

    // Then
    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      status: "error",
      message: "Invalid household",
    });
  });

  test("given a non-JSON error from in front of the Public API then it answers JSON with the same status", async () => {
    // Given
    const { forwarder } = forwarderWith({
      publicApiAnswer: () =>
        new Response("<html>Too many requests</html>", {
          status: 429,
          headers: { "Content-Type": "text/html", "Retry-After": "30" },
        }),
    });

    // When
    const response = await forwarder.forward(CALCULATE_REQUEST, {
      incomingRequest: browserRequest(),
    });

    // Then
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("30");
    expect(await response.json()).toEqual({
      status: "error",
      message: "The Public API answered HTTP 429.",
      result: null,
    });
  });

  test("given a redirect from the Public API then it answers 502 without following it", async () => {
    // Given
    const { forwarder, publicApiCalls } = forwarderWith({
      publicApiAnswer: () =>
        new Response(null, {
          status: 302,
          headers: { Location: "https://elsewhere.example.test/" },
        }),
    });

    // When
    const response = await forwarder.forward(CALCULATE_REQUEST, {
      incomingRequest: browserRequest(),
    });

    // Then
    expect(response.status).toBe(502);
    expect(response.headers.get("location")).toBeNull();
    expect(publicApiCalls()).toHaveLength(1);
  });

  test("given the Public API cannot be reached then it answers 502", async () => {
    // Given
    const { forwarder } = forwarderWith({
      publicApiAnswer: () => {
        throw new TypeError("fetch failed");
      },
    });

    // When
    const response = await forwarder.forward(CALCULATE_REQUEST, {
      incomingRequest: browserRequest(),
    });

    // Then
    expect(response.status).toBe(502);
    expect((await response.json()).message).toBe(
      "The Public API could not be reached.",
    );
  });

  test("given the Public API does not answer in time then it answers 504", async () => {
    // Given a Public API that never answers until the request is aborted
    const abortableForwarder = createPublicApiForwarder({
      environment: PREVIEW_ENVIRONMENT_WITHOUT_CREDENTIAL,
      callerName: "policyengine-test-caller",
      sharedTokenStore: null,
      clientAddress: () => undefined,
      fetchImplementation: (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("aborted", "AbortError")),
          );
        }),
      logger: silentLogger,
    });

    // When
    const response = await abortableForwarder.forward(CALCULATE_REQUEST, {
      incomingRequest: browserRequest(),
      responseHeadersTimeoutMilliseconds: 10,
    });

    // Then
    expect(response.status).toBe(504);
  });

  test("given the token request fails then it answers 502 without calling the Public API", async () => {
    // Given
    const { forwarder, publicApiCalls } = forwarderWith({
      tokenAnswer: () => jsonResponse({ error: "access_denied" }, 403),
    });

    // When
    const response = await forwarder.forward(CALCULATE_REQUEST, {
      incomingRequest: browserRequest(),
    });

    // Then
    expect(response.status).toBe(502);
    expect(publicApiCalls()).toHaveLength(0);
  });

  test("given a preview deployment without POLICYENGINE_API_URL then it answers 503 without calling anything", async () => {
    // Given
    const { forwarder, fetchImplementation } = forwarderWith({
      environment: { VERCEL_ENV: "preview" },
    });

    // When
    const response = await forwarder.forward(CALCULATE_REQUEST, {
      incomingRequest: browserRequest(),
    });

    // Then
    expect(response.status).toBe(503);
    expect(fetchImplementation).not.toHaveBeenCalled();
  });

  test("given extra response headers then every answer carries them, errors included", async () => {
    // Given
    const { forwarder } = forwarderWith({
      environment: { VERCEL_ENV: "preview" },
    });

    // When
    const response = await forwarder.forward(CALCULATE_REQUEST, {
      incomingRequest: browserRequest(),
      responseHeaders: {
        "Access-Control-Allow-Origin": "http://localhost:3000",
      },
    });

    // Then
    expect(response.headers.get("access-control-allow-origin")).toBe(
      "http://localhost:3000",
    );
  });

  test("given a path that could leave the configured Public API then it answers 404 without calling anything", async () => {
    // Given
    const { forwarder, fetchImplementation } = forwarderWith();

    // When
    const response = await forwarder.forward(
      { method: "GET", path: "//elsewhere.example.test/metadata" },
      { incomingRequest: browserRequest() },
    );

    // Then
    expect(response.status).toBe(404);
    expect(fetchImplementation).not.toHaveBeenCalled();
  });
});

describe("isForwardablePath", () => {
  test.each([
    ["/us/calculate", true],
    ["/v2/user-policies/3f2c8b62-4a43-4d4f-9a5c-0d1b8ad8b7e1", true],
    ["/us/../internal", false],
    ["//elsewhere.example.test", false],
    ["/us/metadata?x=1", false],
    ["/us/%2e%2e/internal", false],
    ["us/metadata", false],
    ["/", false],
  ])("given %s then it returns %s", (path, expected) => {
    // When / Then
    expect(isForwardablePath(path)).toBe(expected);
  });
});
