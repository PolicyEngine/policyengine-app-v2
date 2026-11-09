// @vitest-environment node
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import * as economyCompareRoute from "@/app/api/economy/compare/route";
import * as householdCalculateRoute from "@/app/api/household/calculate/route";
import * as metadataRoute from "@/app/api/metadata/[country]/route";
import * as policiesRoute from "@/app/api/policies/route";
import {
  DASHBOARD_VERCEL_HOSTS,
  isAllowedDashboardOrigin,
} from "@/lib/dashboardApi/cors";

import { resolveRoute } from "../helpers/resolveRoute";

const SITE_URL = "https://www.policyengine.org";
const STAGING_PUBLIC_API_URL = "https://public-api-staging.example.test";
const DASHBOARD_HOST_ORIGIN = "https://keep-your-pay-act.vercel.app";
const TEAM_PREVIEW_ORIGIN =
  "https://keep-your-pay-act-git-shared-route-policy-engine.vercel.app";
const LOCAL_DASHBOARD_ORIGIN = "http://localhost:5173";
const OTHER_SITE_ORIGIN = "https://other-site.example.test";
const BROWSER_ADDRESS = "203.0.113.7";

const HOUSEHOLD = {
  people: { you: { age: { 2026: 40 } } },
  households: { your_household: { members: ["you"] } },
};
const REFORM_PARAMETERS = {
  "gov.irs.credits.ctc.amount.base[0].amount": {
    "2026-01-01.2100-12-31": 3000,
  },
};
const CALCULATION_ANSWER = { status: "ok", message: null, result: HOUSEHOLD };
const COMPUTING_ANSWER = { status: "computing", message: null, result: null };
const STORED_POLICY_ID = 98765;

const fetchMock = vi.fn<typeof fetch>();

function jsonAnswer(body: unknown, statusCode = 200): Response {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { "Content-Type": "application/json" },
  });
}

function dashboardRequest(
  path: string,
  {
    method = "GET",
    origin,
    body,
    contentType = "application/json",
  }: {
    method?: string;
    origin?: string;
    body?: unknown;
    contentType?: string;
  } = {},
): Request {
  const headers = new Headers({
    host: "www.policyengine.org",
    "x-real-ip": BROWSER_ADDRESS,
  });
  if (origin !== undefined) {
    headers.set("origin", origin);
  }
  if (body !== undefined) {
    headers.set("content-type", contentType);
  }
  return new Request(`${SITE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function metadataContext(country: string) {
  return { params: Promise.resolve({ country }) };
}

function publicApiCall(callIndex = 0) {
  expect(fetchMock.mock.calls.length).toBeGreaterThan(callIndex);
  const [input, init] = fetchMock.mock.calls[callIndex];
  return {
    url: String(input),
    method: init?.method,
    headers: new Headers(init?.headers),
    body: init?.body === undefined ? undefined : JSON.parse(String(init.body)),
  };
}

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(jsonAnswer(CALCULATION_ANSWER));
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("VERCEL_ENV", "preview");
  vi.stubEnv("POLICYENGINE_API_URL", STAGING_PUBLIC_API_URL);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("POST /api/household/calculate", () => {
  test("given a household then it posts it to the Public API's calculate route and streams the answer back", async () => {
    // When
    const response = await householdCalculateRoute.POST(
      dashboardRequest("/api/household/calculate", {
        method: "POST",
        body: { country: "us", household: HOUSEHOLD },
      }),
    );

    // Then
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(CALCULATION_ANSWER);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(publicApiCall()).toMatchObject({
      url: `${STAGING_PUBLIC_API_URL}/us/calculate`,
      method: "POST",
      body: { household: HOUSEHOLD, policy: {} },
    });
  });

  test("given a browser request then the Public API receives the browser's address", async () => {
    // When
    await householdCalculateRoute.POST(
      dashboardRequest("/api/household/calculate", {
        method: "POST",
        body: { country: "us", household: HOUSEHOLD },
      }),
    );

    // Then
    expect(publicApiCall().headers.get("x-forwarded-for")).toBe(
      BROWSER_ADDRESS,
    );
  });

  test.each([
    ["an unknown country", { country: "fr", household: HOUSEHOLD }],
    ["no household", { country: "us" }],
    ["an unknown field", { country: "us", household: HOUSEHOLD, spm: {} }],
    [
      "a policy that is not an object",
      { country: "us", household: HOUSEHOLD, policy: [] },
    ],
  ])(
    "given %s then it answers 400 without calling the Public API",
    async (_label, body) => {
      // When
      const response = await householdCalculateRoute.POST(
        dashboardRequest("/api/household/calculate", { method: "POST", body }),
      );

      // Then
      expect(response.status).toBe(400);
      expect((await response.json()).status).toBe("error");
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  test("given a body that is not sent as application/json then it answers 415 without calling the Public API", async () => {
    // When
    const response = await householdCalculateRoute.POST(
      dashboardRequest("/api/household/calculate", {
        method: "POST",
        body: { country: "us", household: HOUSEHOLD },
        contentType: "text/plain",
      }),
    );

    // Then
    expect(response.status).toBe(415);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("given a page on another site then it answers 403 without calling the Public API", async () => {
    // When
    const response = await householdCalculateRoute.POST(
      dashboardRequest("/api/household/calculate", {
        method: "POST",
        origin: OTHER_SITE_ORIGIN,
        body: { country: "us", household: HOUSEHOLD },
      }),
    );

    // Then
    expect(response.status).toBe(403);
    expect(response.headers.get("access-control-allow-origin")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test.each([
    ["a dashboard's own Vercel host", DASHBOARD_HOST_ORIGIN],
    ["a PolicyEngine team preview", TEAM_PREVIEW_ORIGIN],
    ["local development", LOCAL_DASHBOARD_ORIGIN],
  ])("given %s then the answer allows that origin", async (_label, origin) => {
    // When
    const response = await householdCalculateRoute.POST(
      dashboardRequest("/api/household/calculate", {
        method: "POST",
        origin,
        body: { country: "us", household: HOUSEHOLD },
      }),
    );

    // Then
    expect(response.status).toBe(200);
    expect(response.headers.get("access-control-allow-origin")).toBe(origin);
    expect(response.headers.get("vary")).toBe("Origin");
  });

  test("given a page on www.policyengine.org itself then it answers without CORS headers", async () => {
    // When
    const response = await householdCalculateRoute.POST(
      dashboardRequest("/api/household/calculate", {
        method: "POST",
        origin: SITE_URL,
        body: { country: "us", household: HOUSEHOLD },
      }),
    );

    // Then
    expect(response.status).toBe(200);
    expect(response.headers.get("access-control-allow-origin")).toBeNull();
  });

  test("given a preflight from a dashboard's own host then it allows the dashboard API's headers", async () => {
    // When
    const response = householdCalculateRoute.OPTIONS(
      dashboardRequest("/api/household/calculate", {
        method: "OPTIONS",
        origin: DASHBOARD_HOST_ORIGIN,
      }),
    );

    // Then
    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe(
      DASHBOARD_HOST_ORIGIN,
    );
    expect(response.headers.get("access-control-allow-headers")).toBe(
      "Content-Type, Authorization, PolicyEngine-Unauthenticated-User",
    );
  });

  test("given a preflight from another site then it answers 403", async () => {
    // When
    const response = householdCalculateRoute.OPTIONS(
      dashboardRequest("/api/household/calculate", {
        method: "OPTIONS",
        origin: OTHER_SITE_ORIGIN,
      }),
    );

    // Then
    expect(response.status).toBe(403);
  });
});

describe("POST /api/policies", () => {
  test("given parameters then it stores them as a Public API policy and answers with its ID", async () => {
    // Given
    fetchMock.mockResolvedValue(
      jsonAnswer(
        {
          status: "ok",
          message: null,
          result: { policy_id: STORED_POLICY_ID },
        },
        201,
      ),
    );

    // When
    const response = await policiesRoute.POST(
      dashboardRequest("/api/policies", {
        method: "POST",
        body: { country: "us", parameters: REFORM_PARAMETERS },
      }),
    );

    // Then
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ id: STORED_POLICY_ID });
    expect(publicApiCall()).toMatchObject({
      url: `${STAGING_PUBLIC_API_URL}/us/policy`,
      method: "POST",
      body: { data: REFORM_PARAMETERS },
    });
  });

  test("given the Public API refuses the parameters then its error reaches the caller", async () => {
    // Given
    const refusal = {
      status: "error",
      message: "Unknown parameter",
      result: null,
    };
    fetchMock.mockResolvedValue(jsonAnswer(refusal, 400));

    // When
    const response = await policiesRoute.POST(
      dashboardRequest("/api/policies", {
        method: "POST",
        body: { country: "us", parameters: REFORM_PARAMETERS },
      }),
    );

    // Then
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual(refusal);
  });

  test("given parameters that are not an object then it answers 400 without calling the Public API", async () => {
    // When
    const response = await policiesRoute.POST(
      dashboardRequest("/api/policies", {
        method: "POST",
        body: { country: "us", parameters: "ctc" },
      }),
    );

    // Then
    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("GET /api/economy/compare", () => {
  test("given a comparison then it reads the Public API's economy route and passes its status through, uncached", async () => {
    // Given
    fetchMock.mockResolvedValue(jsonAnswer(COMPUTING_ANSWER));

    // When
    const response = await economyCompareRoute.GET(
      dashboardRequest(
        "/api/economy/compare?country=us&policy=12&baseline=2&region=state%2Fca&year=2026",
      ),
    );

    // Then
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(COMPUTING_ANSWER);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(publicApiCall()).toMatchObject({
      url: `${STAGING_PUBLIC_API_URL}/us/economy/12/over/2?region=state%2Fca&time_period=2026`,
      method: "GET",
    });
  });

  test.each([
    [
      "a policy that is not an ID",
      "country=us&policy=..%2F1&baseline=2&region=us&year=2026",
    ],
    ["a missing year", "country=us&policy=12&baseline=2&region=us"],
    [
      "a repeated region",
      "country=us&policy=12&baseline=2&region=us&region=uk&year=2026",
    ],
    [
      "an unknown parameter",
      "country=us&policy=12&baseline=2&region=us&year=2026&dataset=enhanced",
    ],
    ["a two-digit year", "country=us&policy=12&baseline=2&region=us&year=26"],
  ])(
    "given %s then it answers 400 without calling the Public API",
    async (_label, query) => {
      // When
      const response = await economyCompareRoute.GET(
        dashboardRequest(`/api/economy/compare?${query}`),
      );

      // Then
      expect(response.status).toBe(400);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );
});

describe("GET /api/metadata/{country}", () => {
  test("given a country then it streams the Public API's metadata with an hour of browser caching", async () => {
    // When
    const response = await metadataRoute.GET(
      dashboardRequest("/api/metadata/uk"),
      metadataContext("uk"),
    );

    // Then
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("max-age=3600");
    expect(publicApiCall()).toMatchObject({
      url: `${STAGING_PUBLIC_API_URL}/uk/metadata`,
      method: "GET",
    });
  });

  test("given an unknown country then it answers 404 without calling the Public API", async () => {
    // When
    const response = await metadataRoute.GET(
      dashboardRequest("/api/metadata/xx"),
      metadataContext("xx"),
    );

    // Then
    expect(response.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("the dashboard API's server credential", () => {
  test("given the website's Auth0 client is configured then the Public API receives its token", async () => {
    // Given
    vi.stubEnv("POLICYENGINE_API_AUTH0_DOMAIN", "auth.example.test");
    vi.stubEnv(
      "POLICYENGINE_API_AUTH0_AUDIENCE",
      "https://staging-api.example.test/",
    );
    vi.stubEnv("POLICYENGINE_API_AUTH0_CLIENT_ID", "website-client-id");
    vi.stubEnv("POLICYENGINE_API_AUTH0_CLIENT_SECRET", "website-client-secret");
    fetchMock.mockImplementation(async (input) =>
      String(input) === "https://auth.example.test/oauth/token"
        ? jsonAnswer({
            access_token: "website-server-token",
            expires_in: 86_400,
          })
        : jsonAnswer(CALCULATION_ANSWER),
    );

    // When
    const response = await householdCalculateRoute.POST(
      dashboardRequest("/api/household/calculate", {
        method: "POST",
        body: { country: "us", household: HOUSEHOLD },
      }),
    );

    // Then
    expect(response.status).toBe(200);
    const calculateCall = fetchMock.mock.calls.findIndex(([input]) =>
      String(input).endsWith("/us/calculate"),
    );
    expect(publicApiCall(calculateCall).headers.get("authorization")).toBe(
      "Bearer website-server-token",
    );
    expect(await response.text()).not.toContain("website-server-token");
  });

  test("given a preview deployment without POLICYENGINE_API_URL then it refuses rather than calling the production Public API", async () => {
    // Given
    vi.stubEnv("POLICYENGINE_API_URL", "");

    // When
    const response = await metadataRoute.GET(
      dashboardRequest("/api/metadata/us"),
      metadataContext("us"),
    );

    // Then
    expect(response.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("dashboard API origins", () => {
  test("given the zone routes then every dashboard *.vercel.app host is allowed and no other host is", () => {
    // Then
    expect(DASHBOARD_VERCEL_HOSTS.size).toBeGreaterThan(50);
    for (const host of DASHBOARD_VERCEL_HOSTS) {
      expect(isAllowedDashboardOrigin(new URL(`https://${host}`))).toBe(true);
    }
    expect(
      isAllowedDashboardOrigin(new URL("https://someone-else.vercel.app")),
    ).toBe(false);
    expect(
      isAllowedDashboardOrigin(
        new URL("https://policyengine--state-legislative-tracker.modal.run"),
      ),
    ).toBe(false);
  });

  test.each([
    "/api/household/calculate",
    "/api/policies",
    "/api/economy/compare",
    "/api/metadata/us",
  ])(
    "given %s then no website redirect or zone rewrite takes it",
    async (path) => {
      // When
      const resolved = await resolveRoute(path);

      // Then
      expect(resolved).toEqual({ hops: [], pathname: path, upstream: null });
    },
  );
});
