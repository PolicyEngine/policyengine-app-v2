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

async function getRedirects() {
  if (!nextConfig.redirects) {
    throw new Error("Expected Next config to define redirects.");
  }

  return nextConfig.redirects();
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

  test("preserves the UK chat base path for pages, assets, and API routes", async () => {
    const beforeFiles = await getBeforeFileRewrites();

    expect(beforeFiles).toContainEqual({
      source: "/uk/chat",
      destination: "https://policyengine-uk-chat.vercel.app/uk/chat",
    });
    expect(beforeFiles).toContainEqual({
      source: "/uk/chat/:path*",
      destination: "https://policyengine-uk-chat.vercel.app/uk/chat/:path*",
    });
  });
});

describe("nextConfig redirects", () => {
  test("redirects the bare /policybench vanity path to policybench.org", async () => {
    const redirects = await getRedirects();

    expect(redirects).toContainEqual({
      source: "/policybench",
      destination: "https://policybench.org",
      permanent: false,
    });
  });

  test("redirects the country-prefixed /policybench vanity path to policybench.org", async () => {
    const redirects = await getRedirects();

    expect(redirects).toContainEqual({
      source: "/:countryId/policybench",
      destination: "https://policybench.org",
      permanent: false,
    });
  });
});
