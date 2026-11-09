import { describe, expect, test } from "vitest";

import {
  checkOrigin,
  corsResponseHeaders,
  isLocalDevelopmentOrigin,
  preflightResponse,
  type CorsPolicy,
} from "../src/cors";

const SITE_URL = "https://www.example.test";
const ALLOWED_ORIGIN = "https://dashboard.example.test";
const OTHER_ORIGIN = "https://elsewhere.example.test";

const POLICY: CorsPolicy = {
  isAllowedOrigin: (origin) =>
    origin.origin === ALLOWED_ORIGIN || isLocalDevelopmentOrigin(origin),
  allowedMethods: ["GET", "POST"],
  allowedRequestHeaders: ["Content-Type", "Authorization"],
  exposedResponseHeaders: ["Retry-After"],
  preflightMaxAgeSeconds: 600,
};

function requestFrom(
  origin: string | null,
  method = "GET",
  fetchSite?: string,
): Request {
  const headers = new Headers({ host: "www.example.test" });
  if (origin !== null) {
    headers.set("origin", origin);
  }
  if (fetchSite !== undefined) {
    headers.set("sec-fetch-site", fetchSite);
  }
  return new Request(`${SITE_URL}/api/metadata/us`, { method, headers });
}

describe("checkOrigin", () => {
  test.each([
    ["no Origin header", null, "no-origin"],
    ["the site's own origin", SITE_URL, "same-origin"],
    ["an allowed origin", ALLOWED_ORIGIN, "allowed"],
    ["localhost on any port", "http://localhost:5173", "allowed"],
    ["127.0.0.1 on any port", "http://127.0.0.1:3000", "allowed"],
    ["another site", OTHER_ORIGIN, "refused"],
    ["an https localhost", "https://localhost:5173", "refused"],
    ["the null origin", "null", "refused"],
  ])("given %s then it returns %s", (_label, origin, expectedKind) => {
    // When
    const check = checkOrigin(requestFrom(origin), POLICY);

    // Then
    expect(check.kind).toBe(expectedKind);
  });
});

describe("checkOrigin without an Origin header", () => {
  test.each([
    ["cross-site", "refused"],
    ["same-site", "refused"],
    ["same-origin", "no-origin"],
    ["none", "no-origin"],
  ])(
    "given a browser's Sec-Fetch-Site of %s then it returns %s",
    (fetchSite, expectedKind) => {
      // When
      const check = checkOrigin(requestFrom(null, "GET", fetchSite), POLICY);

      // Then
      expect(check.kind).toBe(expectedKind);
    },
  );
});

describe("corsResponseHeaders", () => {
  test("given an allowed origin then it allows that origin only and exposes the listed headers", () => {
    // When
    const headers = corsResponseHeaders(
      checkOrigin(requestFrom(ALLOWED_ORIGIN), POLICY),
      POLICY,
    );

    // Then
    expect(Object.fromEntries(headers)).toEqual({
      "access-control-allow-origin": ALLOWED_ORIGIN,
      "access-control-expose-headers": "Retry-After",
      vary: "Origin",
    });
  });

  test("given a same-origin request then it adds no Access-Control headers", () => {
    // When
    const headers = corsResponseHeaders(
      checkOrigin(requestFrom(SITE_URL), POLICY),
      POLICY,
    );

    // Then
    expect(Object.fromEntries(headers)).toEqual({ vary: "Origin" });
  });
});

describe("preflightResponse", () => {
  test("given an allowed origin then it answers 204 with the allowed methods and headers", () => {
    // When
    const response = preflightResponse(
      requestFrom(ALLOWED_ORIGIN, "OPTIONS"),
      POLICY,
    );

    // Then
    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe(
      ALLOWED_ORIGIN,
    );
    expect(response.headers.get("access-control-allow-methods")).toBe(
      "GET, POST, OPTIONS",
    );
    expect(response.headers.get("access-control-allow-headers")).toBe(
      "Content-Type, Authorization",
    );
    expect(response.headers.get("access-control-max-age")).toBe("600");
  });

  test("given another site then it answers 403 without Access-Control headers", () => {
    // When
    const response = preflightResponse(
      requestFrom(OTHER_ORIGIN, "OPTIONS"),
      POLICY,
    );

    // Then
    expect(response.status).toBe(403);
    expect(response.headers.get("access-control-allow-origin")).toBeNull();
  });
});
