import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { GET } from "../../../../app/api/geolocate/route";

describe("GET /api/geolocate", () => {
  const originalFetch = global.fetch;
  const originalKey = process.env.IPAPI_CO_KEY;

  beforeEach(() => {
    vi.resetAllMocks();
    delete process.env.IPAPI_CO_KEY;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalKey !== undefined) {
      process.env.IPAPI_CO_KEY = originalKey;
    } else {
      delete process.env.IPAPI_CO_KEY;
    }
  });

  test("given upstream returns a country code then 200 with the code", async () => {
    // Given
    global.fetch = vi.fn().mockResolvedValue(
      new Response("US\n", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      }),
    );

    // When
    const response = await GET();

    // Then
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("US");
    expect(response.headers.get("content-type")).toMatch(/^text\/plain/);
    expect(response.headers.get("cache-control")).toContain("max-age=300");
  });

  test("given upstream returns lowercase then response is upper-cased", async () => {
    // Given
    global.fetch = vi.fn().mockResolvedValue(
      new Response("gb", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      }),
    );

    // When
    const response = await GET();

    // Then
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("GB");
  });

  test("given no IPAPI_CO_KEY then free-tier endpoint is called", async () => {
    // Given
    const mockFetch = vi.fn().mockResolvedValue(
      new Response("US", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      }),
    );
    global.fetch = mockFetch;

    // When
    await GET();

    // Then — no ?key= in the URL
    const [calledUrl] = mockFetch.mock.calls[0] as [string];
    expect(calledUrl).toBe("https://ipapi.co/country_code/");
    expect(calledUrl).not.toContain("key=");
  });

  test("given IPAPI_CO_KEY is set then paid-tier endpoint is called with it", async () => {
    // Given
    process.env.IPAPI_CO_KEY = "secret-test-key";
    const mockFetch = vi.fn().mockResolvedValue(
      new Response("US", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      }),
    );
    global.fetch = mockFetch;

    // When
    await GET();

    // Then — the key is appended server-side and never surfaces to the caller
    const [calledUrl] = mockFetch.mock.calls[0] as [string];
    expect(calledUrl).toBe(
      "https://ipapi.co/country_code/?key=secret-test-key",
    );
  });

  test("given upstream 5xx then 502 with empty body (no key leak)", async () => {
    // Given
    process.env.IPAPI_CO_KEY = "secret-test-key";
    global.fetch = vi.fn().mockResolvedValue(
      new Response("Internal Server Error", { status: 500 }),
    );

    // When
    const response = await GET();

    // Then
    expect(response.status).toBe(502);
    const body = await response.text();
    expect(body).toBe("");
    expect(body).not.toContain("secret-test-key");
  });

  test("given upstream returns malformed body then 502", async () => {
    // Given — invalid country code length
    global.fetch = vi.fn().mockResolvedValue(
      new Response("INVALID", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      }),
    );

    // When
    const response = await GET();

    // Then
    expect(response.status).toBe(502);
    expect(await response.text()).toBe("");
  });

  test("given upstream returns empty body then 502", async () => {
    // Given
    global.fetch = vi.fn().mockResolvedValue(
      new Response("", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      }),
    );

    // When
    const response = await GET();

    // Then
    expect(response.status).toBe(502);
  });

  test("given fetch throws then 502", async () => {
    // Given
    global.fetch = vi.fn().mockRejectedValue(new Error("Timeout"));

    // When
    const response = await GET();

    // Then
    expect(response.status).toBe(502);
  });
});
