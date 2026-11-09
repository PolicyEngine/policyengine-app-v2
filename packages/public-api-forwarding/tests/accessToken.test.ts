import { beforeEach, describe, expect, test, vi } from "vitest";

import {
  AccessTokenError,
  TOKEN_REFRESH_MARGIN_SECONDS,
  createAccessTokenProvider,
} from "../src/accessToken";
import {
  SECOND_SERVER_ACCESS_TOKEN,
  SERVER_ACCESS_TOKEN,
  START_TIME_MILLISECONDS,
  TOKEN_ENDPOINT_HOST,
  TOKEN_LIFETIME_SECONDS,
  WEBSITE_CREDENTIAL,
  createFakeSharedStore,
  jsonResponse,
  silentLogger,
  tokenResponse,
} from "./fixtures";

function providerWith(
  fetchImplementation: typeof fetch,
  sharedStore = createFakeSharedStore(),
  clock = { now: START_TIME_MILLISECONDS },
) {
  return {
    sharedStore,
    clock,
    getAccessToken: createAccessTokenProvider({
      sharedStore,
      fetchImplementation,
      now: () => clock.now,
      logger: silentLogger,
    }),
  };
}

describe("createAccessTokenProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("given no cached token then it requests a client-credentials token from the Auth0 token endpoint", async () => {
    // Given
    const fetchImplementation = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) => tokenResponse(),
    );
    const { getAccessToken } = providerWith(fetchImplementation);

    // When
    const accessToken = await getAccessToken(WEBSITE_CREDENTIAL);

    // Then
    expect(accessToken).toBe(SERVER_ACCESS_TOKEN);
    const [requestUrl, requestInit] = fetchImplementation.mock.calls[0];
    expect(String(requestUrl)).toBe(
      `https://${TOKEN_ENDPOINT_HOST}/oauth/token`,
    );
    expect(JSON.parse(String(requestInit?.body))).toEqual({
      grant_type: "client_credentials",
      client_id: WEBSITE_CREDENTIAL.clientId,
      client_secret: WEBSITE_CREDENTIAL.clientSecret,
      audience: WEBSITE_CREDENTIAL.audience,
    });
  });

  test("given a token obtained earlier then later requests reuse it without asking Auth0 again", async () => {
    // Given
    const fetchImplementation = vi.fn(async () => tokenResponse());
    const { getAccessToken } = providerWith(fetchImplementation);
    await getAccessToken(WEBSITE_CREDENTIAL);

    // When
    const accessToken = await getAccessToken(WEBSITE_CREDENTIAL);

    // Then
    expect(accessToken).toBe(SERVER_ACCESS_TOKEN);
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
  });

  test("given several requests at once then they share one Auth0 token request", async () => {
    // Given
    const fetchImplementation = vi.fn(async () => tokenResponse());
    const { getAccessToken } = providerWith(fetchImplementation);

    // When
    const accessTokens = await Promise.all([
      getAccessToken(WEBSITE_CREDENTIAL),
      getAccessToken(WEBSITE_CREDENTIAL),
      getAccessToken(WEBSITE_CREDENTIAL),
    ]);

    // Then
    expect(accessTokens).toEqual([
      SERVER_ACCESS_TOKEN,
      SERVER_ACCESS_TOKEN,
      SERVER_ACCESS_TOKEN,
    ]);
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
  });

  test("given a new token then it is stored in the shared cache until five minutes before it expires, without the client secret", async () => {
    // Given
    const fetchImplementation = vi.fn(async () => tokenResponse());
    const { getAccessToken, sharedStore } = providerWith(fetchImplementation);

    // When
    await getAccessToken(WEBSITE_CREDENTIAL);

    // Then
    expect(sharedStore.ttlSeconds).toEqual([
      TOKEN_LIFETIME_SECONDS - TOKEN_REFRESH_MARGIN_SECONDS,
    ]);
    const storedText = JSON.stringify([...sharedStore.entries]);
    expect(storedText).toContain(SERVER_ACCESS_TOKEN);
    expect(storedText).not.toContain(WEBSITE_CREDENTIAL.clientSecret);
  });

  test("given a token another instance stored in the shared cache then it uses that token without asking Auth0", async () => {
    // Given
    const sharedStore = createFakeSharedStore();
    const otherInstance = providerWith(
      vi.fn(async () => tokenResponse()),
      sharedStore,
    );
    await otherInstance.getAccessToken(WEBSITE_CREDENTIAL);
    const fetchImplementation = vi.fn(async () =>
      tokenResponse(SECOND_SERVER_ACCESS_TOKEN),
    );
    const { getAccessToken } = providerWith(fetchImplementation, sharedStore);

    // When
    const accessToken = await getAccessToken(WEBSITE_CREDENTIAL);

    // Then
    expect(accessToken).toBe(SERVER_ACCESS_TOKEN);
    expect(fetchImplementation).not.toHaveBeenCalled();
  });

  test("given a token within five minutes of expiry then it requests a new one", async () => {
    // Given
    const fetchImplementation = vi
      .fn()
      .mockResolvedValueOnce(tokenResponse(SERVER_ACCESS_TOKEN))
      .mockResolvedValueOnce(tokenResponse(SECOND_SERVER_ACCESS_TOKEN));
    const { getAccessToken, clock } = providerWith(fetchImplementation);
    await getAccessToken(WEBSITE_CREDENTIAL);
    clock.now += (TOKEN_LIFETIME_SECONDS - TOKEN_REFRESH_MARGIN_SECONDS) * 1000;

    // When
    const accessToken = await getAccessToken(WEBSITE_CREDENTIAL);

    // Then
    expect(accessToken).toBe(SECOND_SERVER_ACCESS_TOKEN);
    expect(fetchImplementation).toHaveBeenCalledTimes(2);
  });

  test("given a shared cache that fails then it still returns a token and keeps it in memory", async () => {
    // Given
    const failingStore = {
      get: vi.fn(async () => {
        throw new Error("Runtime Cache unavailable");
      }),
      set: vi.fn(async () => {
        throw new Error("Runtime Cache unavailable");
      }),
    };
    const fetchImplementation = vi.fn(async () => tokenResponse());
    const { getAccessToken } = providerWith(
      fetchImplementation,
      failingStore as never,
    );

    // When
    const firstToken = await getAccessToken(WEBSITE_CREDENTIAL);
    const secondToken = await getAccessToken(WEBSITE_CREDENTIAL);

    // Then
    expect([firstToken, secondToken]).toEqual([
      SERVER_ACCESS_TOKEN,
      SERVER_ACCESS_TOKEN,
    ]);
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
  });

  test("given Auth0 refuses the client then it throws an AccessTokenError naming the status but not the secret", async () => {
    // Given
    const fetchImplementation = vi.fn(async () =>
      jsonResponse(
        { error: "access_denied", error_description: "Unauthorized" },
        401,
      ),
    );
    const { getAccessToken } = providerWith(fetchImplementation);

    // When
    const failure = await getAccessToken(WEBSITE_CREDENTIAL).catch(
      (error: unknown) => error,
    );

    // Then
    expect(failure).toBeInstanceOf(AccessTokenError);
    expect((failure as Error).message).toContain("401");
    expect((failure as Error).message).not.toContain(
      WEBSITE_CREDENTIAL.clientSecret,
    );
  });

  test("given a failed token request then the next request asks Auth0 again", async () => {
    // Given
    const fetchImplementation = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: "server_error" }, 503))
      .mockResolvedValueOnce(tokenResponse());
    const { getAccessToken } = providerWith(fetchImplementation);
    await getAccessToken(WEBSITE_CREDENTIAL).catch(() => undefined);

    // When
    const accessToken = await getAccessToken(WEBSITE_CREDENTIAL);

    // Then
    expect(accessToken).toBe(SERVER_ACCESS_TOKEN);
  });

  test("given a token request then it never follows a redirect, which would re-send the client secret", async () => {
    // Given
    const fetchImplementation = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) => tokenResponse(),
    );
    const { getAccessToken } = providerWith(fetchImplementation);

    // When
    await getAccessToken(WEBSITE_CREDENTIAL);

    // Then
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
    expect(fetchImplementation.mock.calls[0][1]?.redirect).toBe("error");
  });

  test("given a token shorter than ten minutes then it is replaced halfway through its life", async () => {
    // Given
    const shortLifetimeSeconds = 400;
    const fetchImplementation = vi
      .fn()
      .mockResolvedValueOnce(
        tokenResponse(SERVER_ACCESS_TOKEN, shortLifetimeSeconds),
      )
      .mockResolvedValueOnce(tokenResponse(SECOND_SERVER_ACCESS_TOKEN));
    const { getAccessToken, clock } = providerWith(fetchImplementation);
    await getAccessToken(WEBSITE_CREDENTIAL);

    // When
    clock.now += (shortLifetimeSeconds / 2 - 1) * 1000;
    const tokenBeforeHalfway = await getAccessToken(WEBSITE_CREDENTIAL);
    clock.now += 1000;
    const tokenAtHalfway = await getAccessToken(WEBSITE_CREDENTIAL);

    // Then
    expect([tokenBeforeHalfway, tokenAtHalfway]).toEqual([
      SERVER_ACCESS_TOKEN,
      SECOND_SERVER_ACCESS_TOKEN,
    ]);
  });

  test("given the token request fails on the network then the error names the cause, not only fetch's own message", async () => {
    // Given
    const fetchImplementation = vi.fn(async () => {
      throw new TypeError("fetch failed", {
        cause: new Error("getaddrinfo ENOTFOUND auth.example.test"),
      });
    });
    const { getAccessToken } = providerWith(fetchImplementation);

    // When
    const failure = await getAccessToken(WEBSITE_CREDENTIAL).catch(
      (error: unknown) => error,
    );

    // Then
    expect((failure as Error).message).toContain("ENOTFOUND");
  });
});
