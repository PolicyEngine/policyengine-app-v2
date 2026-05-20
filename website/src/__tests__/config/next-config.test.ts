import { describe, expect, test } from "vitest";

import nextConfig from "../../../next.config";

const tealSquareLogoPath = "/assets/logos/policyengine/teal-square.png";

const expectedPolicyEngineIconRewrites = [
  { source: "/favicon.ico", destination: tealSquareLogoPath },
  { source: "/apple-touch-icon.png", destination: tealSquareLogoPath },
  { source: "/logo192.png", destination: tealSquareLogoPath },
  { source: "/logo512.png", destination: tealSquareLogoPath },
  { source: "/policyengine-logo.png", destination: tealSquareLogoPath },
  { source: "/icon.svg", destination: "/favicon.svg" },
  { source: "/policyengine-favicon.svg", destination: "/favicon.svg" },
  {
    source: "/:countryId/:appSlug/favicon.ico",
    destination: tealSquareLogoPath,
  },
  {
    source: "/:countryId/:appSlug/apple-touch-icon.png",
    destination: tealSquareLogoPath,
  },
  {
    source: "/:countryId/:appSlug/logo192.png",
    destination: tealSquareLogoPath,
  },
  {
    source: "/:countryId/:appSlug/logo512.png",
    destination: tealSquareLogoPath,
  },
  {
    source: "/:countryId/:appSlug/policyengine-logo.png",
    destination: tealSquareLogoPath,
  },
  { source: "/:countryId/:appSlug/favicon.svg", destination: "/favicon.svg" },
  { source: "/:countryId/:appSlug/icon.svg", destination: "/favicon.svg" },
  {
    source: "/:countryId/:appSlug/policyengine-favicon.svg",
    destination: "/favicon.svg",
  },
] as const;

async function getBeforeFileRewrites() {
  if (!nextConfig.rewrites) {
    throw new Error("Expected Next config to define rewrites.");
  }

  const rewrites = await nextConfig.rewrites();
  if (Array.isArray(rewrites) || !("beforeFiles" in rewrites)) {
    throw new Error("Expected rewrites to define beforeFiles.");
  }

  return rewrites.beforeFiles ?? [];
}

describe("nextConfig rewrites", () => {
  test("serves PolicyEngine icon fallbacks before app-zone proxies", async () => {
    const beforeFiles = await getBeforeFileRewrites();

    expect(
      beforeFiles.slice(0, expectedPolicyEngineIconRewrites.length),
    ).toEqual(expectedPolicyEngineIconRewrites);

    expect(
      beforeFiles.findIndex(
        (rewrite) => rewrite.source === "/us/tanf-calculator",
      ),
    ).toBeGreaterThan(expectedPolicyEngineIconRewrites.length - 1);
  });
});
