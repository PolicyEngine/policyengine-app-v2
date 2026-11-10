// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import type { PublicApiForwarder } from "@policyengine/public-api-forwarding";

import { GET as getDeployments } from "@/app/api/deployments/route";
import { API_ORIGIN } from "@/lib/deployments";
import { withPublicApiCredential } from "@/lib/publicApi/serverFetch";

const STAGING_PUBLIC_API_URL = "https://public-api-staging.example.test";
const TOKEN_ENDPOINT = "https://auth.example.test/oauth/token";
const WEBSITE_SERVER_TOKEN = "website-server-token";
const PYPI_URL = "https://pypi.org/pypi/policyengine/json";
const REVALIDATE_SECONDS = 900;

function fakePublicApi() {
  const fetchFromServer = vi.fn<PublicApiForwarder["fetchFromServer"]>(
    async () => Response.json({ status: "ok", result: {} }),
  );
  const publicApi: PublicApiForwarder = {
    forward: vi.fn(),
    fetchFromServer,
  };
  return { publicApi, fetchFromServer };
}

describe("withPublicApiCredential", () => {
  test("given a request to the Public API's address then it goes through the website's Public API connection with its cache options", async () => {
    // Given
    const underlyingFetch = vi.fn(async () => new Response("unused"));
    const { publicApi, fetchFromServer } = fakePublicApi();
    const fetchWithCredential = withPublicApiCredential(
      underlyingFetch,
      publicApi,
    );

    // When
    await fetchWithCredential(
      `${API_ORIGIN}/v2/tax-benefit-models/by-country/us`,
      { next: { revalidate: REVALIDATE_SECONDS } },
    );

    // Then
    expect(fetchFromServer).toHaveBeenCalledWith(
      {
        method: "GET",
        path: "/v2/tax-benefit-models/by-country/us",
        query: undefined,
        body: undefined,
      },
      { next: { revalidate: REVALIDATE_SECONDS } },
    );
    expect(underlyingFetch).not.toHaveBeenCalled();
  });

  test("given a request to another host then it is passed on unchanged", async () => {
    // Given
    const underlyingFetch = vi.fn(async () => new Response("{}"));
    const { publicApi, fetchFromServer } = fakePublicApi();
    const fetchWithCredential = withPublicApiCredential(
      underlyingFetch,
      publicApi,
    );
    const requestInit = { next: { revalidate: REVALIDATE_SECONDS } };

    // When
    await fetchWithCredential(PYPI_URL, requestInit);

    // Then
    expect(underlyingFetch).toHaveBeenCalledWith(PYPI_URL, requestInit);
    expect(fetchFromServer).not.toHaveBeenCalled();
  });
});

describe("withPublicApiCredential request options", () => {
  test.each([
    ["headers", { headers: { "X-Extra": "1" } }],
    ["a signal", { signal: new AbortController().signal }],
    ["a cache mode", { cache: "no-store" as RequestCache }],
    ["a body that is not a string", { method: "POST", body: new Blob(["{}"]) }],
  ])(
    "given %s for a Public API request then it refuses rather than dropping them",
    async (_label, requestInit) => {
      // Given
      const { publicApi, fetchFromServer } = fakePublicApi();
      const fetchWithCredential = withPublicApiCredential(
        vi.fn(async () => new Response("unused")),
        publicApi,
      );

      // When
      const failure = await fetchWithCredential(
        `${API_ORIGIN}/deployment`,
        requestInit as Parameters<typeof fetchWithCredential>[1],
      ).catch((error: unknown) => error);

      // Then
      expect(failure).toBeInstanceOf(TypeError);
      expect(fetchFromServer).not.toHaveBeenCalled();
    },
  );

  test("given a null body and a null signal, which fetch reads as none, then the Public API request goes through", async () => {
    // Given
    const { publicApi, fetchFromServer } = fakePublicApi();
    const fetchWithCredential = withPublicApiCredential(
      vi.fn(async () => new Response("unused")),
      publicApi,
    );

    // When
    await fetchWithCredential(`${API_ORIGIN}/deployment`, {
      body: null,
      signal: null,
    } as Parameters<typeof fetchWithCredential>[1]);

    // Then
    expect(fetchFromServer).toHaveBeenCalledTimes(1);
    expect(fetchFromServer.mock.calls[0][0].body).toBeUndefined();
  });

  test("given the same options for another host then they are passed on as they are", async () => {
    // Given
    const underlyingFetch = vi.fn(async () => new Response("{}"));
    const { publicApi } = fakePublicApi();
    const fetchWithCredential = withPublicApiCredential(
      underlyingFetch,
      publicApi,
    );
    const requestInit = { headers: { "X-Extra": "1" } };

    // When
    await fetchWithCredential(PYPI_URL, requestInit);

    // Then
    expect(underlyingFetch).toHaveBeenCalledWith(PYPI_URL, requestInit);
  });
});

describe("GET /api/deployments", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);
      if (url === TOKEN_ENDPOINT) {
        return Response.json({
          access_token: WEBSITE_SERVER_TOKEN,
          expires_in: 86_400,
        });
      }
      if (url.startsWith(STAGING_PUBLIC_API_URL)) {
        return Response.json({
          status: "ok",
          result: { policyengine_version: "6.9.0" },
          policyengine_version_live_since: "2026-10-20T12:00:00Z",
        });
      }
      return new Response("not found", { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("POLICYENGINE_API_URL", STAGING_PUBLIC_API_URL);
    vi.stubEnv("POLICYENGINE_API_AUTH0_DOMAIN", "auth.example.test");
    vi.stubEnv(
      "POLICYENGINE_API_AUTH0_AUDIENCE",
      "https://staging-api.example.test/",
    );
    vi.stubEnv("POLICYENGINE_API_AUTH0_CLIENT_ID", "website-client-id");
    vi.stubEnv("POLICYENGINE_API_AUTH0_CLIENT_SECRET", "website-client-secret");
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  test("given the website's credential is configured then its Public API requests carry it and go to this deployment's Public API", async () => {
    // When
    const response = await getDeployments(
      new NextRequest(
        "https://www.policyengine.org/api/deployments?country=us",
      ),
    );

    // Then
    expect(response.status).toBe(200);
    const requestedUrls = fetchMock.mock.calls.map(([input]) => String(input));
    const publicApiCalls = fetchMock.mock.calls.filter(([input]) =>
      String(input).startsWith(STAGING_PUBLIC_API_URL),
    );
    expect(
      publicApiCalls.map(([input]) => new URL(String(input)).pathname),
    ).toEqual(
      expect.arrayContaining([
        "/v2/tax-benefit-models/by-country/us",
        "/deployment",
      ]),
    );
    for (const [, init] of publicApiCalls) {
      expect(new Headers(init?.headers).get("authorization")).toBe(
        `Bearer ${WEBSITE_SERVER_TOKEN}`,
      );
    }
    expect(requestedUrls.filter((url) => url.startsWith(API_ORIGIN))).toEqual(
      [],
    );
  });

  test("given a preview reading the Public API's staging service then the Public API rows name the address read", async () => {
    // When
    const response = await getDeployments(
      new NextRequest(
        "https://www.policyengine.org/api/deployments?country=us",
      ),
    );

    // Then
    const body = (await response.json()) as {
      rows: Array<{
        surface: { serves: string; served?: { origin: string } };
        served: { source_url?: string | null };
      }>;
    };
    const publicApiRows = body.rows.filter(
      (row) => row.surface.served?.origin === STAGING_PUBLIC_API_URL,
    );
    expect(publicApiRows.length).toBeGreaterThan(0);
    for (const row of publicApiRows) {
      expect(row.surface.serves).toBe(new URL(STAGING_PUBLIC_API_URL).host);
      expect(row.served.source_url?.startsWith(STAGING_PUBLIC_API_URL)).toBe(
        true,
      );
    }
    expect(JSON.stringify(body)).not.toContain(API_ORIGIN);
  });

  test("given the website's credential is configured then no other host receives it", async () => {
    // When
    await getDeployments(
      new NextRequest(
        "https://www.policyengine.org/api/deployments?country=us",
      ),
    );

    // Then
    const otherHostCalls = fetchMock.mock.calls.filter(([input]) => {
      const url = String(input);
      return !url.startsWith(STAGING_PUBLIC_API_URL) && url !== TOKEN_ENDPOINT;
    });
    expect(otherHostCalls.length).toBeGreaterThan(0);
    for (const [, init] of otherHostCalls) {
      expect(new Headers(init?.headers).get("authorization")).toBeNull();
    }
  });
});
