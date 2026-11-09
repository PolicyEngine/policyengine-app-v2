import { describe, expect, test } from "vitest";

import {
  PRODUCTION_PUBLIC_API_URL,
  readPublicApiSettings,
} from "../src/settings";
import {
  PREVIEW_ENVIRONMENT_WITHOUT_CREDENTIAL,
  PREVIEW_ENVIRONMENT_WITH_CREDENTIAL,
  STAGING_PUBLIC_API_URL,
  WEBSITE_CREDENTIAL,
} from "./fixtures";

describe("readPublicApiSettings", () => {
  test("given a production deployment with no variables then it calls the production Public API without a credential", () => {
    // When
    const result = readPublicApiSettings({ VERCEL_ENV: "production" });

    // Then
    expect(result).toEqual({
      ok: true,
      settings: { baseUrl: PRODUCTION_PUBLIC_API_URL, credential: null },
    });
  });

  test.each([
    ["preview", { VERCEL_ENV: "preview" }],
    ["development", { VERCEL_ENV: "development" }],
    ["local work without VERCEL_ENV", {}],
  ])(
    "given a %s deployment without POLICYENGINE_API_URL then it refuses rather than calling production",
    (_label, environment) => {
      // When
      const result = readPublicApiSettings(environment);

      // Then
      expect(result.ok).toBe(false);
    },
  );

  test("given a preview deployment naming the staging Public API then it calls that URL without a trailing slash", () => {
    // When
    const result = readPublicApiSettings({
      ...PREVIEW_ENVIRONMENT_WITHOUT_CREDENTIAL,
      POLICYENGINE_API_URL: `${STAGING_PUBLIC_API_URL}/`,
    });

    // Then
    expect(result).toEqual({
      ok: true,
      settings: { baseUrl: STAGING_PUBLIC_API_URL, credential: null },
    });
  });

  test.each([
    "http://public-api.example.test",
    "not a url",
    "https://public-api.example.test/?debug=1",
  ])(
    "given POLICYENGINE_API_URL %s then it refuses the settings",
    (configuredUrl) => {
      // When
      const result = readPublicApiSettings({
        VERCEL_ENV: "production",
        POLICYENGINE_API_URL: configuredUrl,
      });

      // Then
      expect(result.ok).toBe(false);
    },
  );

  test("given a local http Public API then it accepts it for local work", () => {
    // When
    const result = readPublicApiSettings({
      POLICYENGINE_API_URL: "http://localhost:5000",
    });

    // Then
    expect(result).toEqual({
      ok: true,
      settings: { baseUrl: "http://localhost:5000", credential: null },
    });
  });

  test("given all four Auth0 variables then it returns the credential", () => {
    // When
    const result = readPublicApiSettings(PREVIEW_ENVIRONMENT_WITH_CREDENTIAL);

    // Then
    expect(result).toEqual({
      ok: true,
      settings: {
        baseUrl: STAGING_PUBLIC_API_URL,
        credential: WEBSITE_CREDENTIAL,
      },
    });
  });

  test("given the Auth0 domain as an https URL with a trailing slash then it keeps only the host name", () => {
    // When
    const result = readPublicApiSettings({
      ...PREVIEW_ENVIRONMENT_WITH_CREDENTIAL,
      POLICYENGINE_API_AUTH0_DOMAIN: `https://${WEBSITE_CREDENTIAL.tokenEndpointHost}/`,
    });

    // Then
    expect(result.ok && result.settings.credential?.tokenEndpointHost).toBe(
      WEBSITE_CREDENTIAL.tokenEndpointHost,
    );
  });

  test("given only some Auth0 variables then it refuses and names the missing ones without any value", () => {
    // Given
    const environment = {
      ...PREVIEW_ENVIRONMENT_WITH_CREDENTIAL,
      POLICYENGINE_API_AUTH0_CLIENT_SECRET: "",
    };

    // When
    const result = readPublicApiSettings(environment);

    // Then
    expect(result).toEqual({
      ok: false,
      problem: expect.stringContaining("POLICYENGINE_API_AUTH0_CLIENT_SECRET"),
    });
    expect(JSON.stringify(result)).not.toContain(WEBSITE_CREDENTIAL.clientId);
  });
});
