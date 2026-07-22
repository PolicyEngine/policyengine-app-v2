import { describe, expect, test } from "vitest";

import nextConfig from "../../../next.config";
import { ALLOWED_WIDTHS } from "../../components/ui/OptimisedImage";

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

describe("nextConfig images", () => {
  // Vercel's optimiser only serves widths in imageSizes ∪ deviceSizes; any
  // width OptimisedImage can emit but the config doesn't allow becomes a 400
  // (broken image) in production — e.g. the w=512 2x variant of the 250px
  // team headshots before this config existed.
  test("allows every width OptimisedImage can request", () => {
    const { imageSizes, deviceSizes } = nextConfig.images ?? {};
    const allowed = new Set([...(imageSizes ?? []), ...(deviceSizes ?? [])]);

    for (const width of ALLOWED_WIDTHS) {
      expect(allowed).toContain(width);
    }
  });

  test("keeps imageSizes below the smallest deviceSize, as Next requires", () => {
    const { imageSizes, deviceSizes } = nextConfig.images ?? {};

    expect(imageSizes?.length).toBeGreaterThan(0);
    expect(deviceSizes?.length).toBeGreaterThan(0);

    const smallestDeviceSize = Math.min(...(deviceSizes ?? []));
    for (const size of imageSizes ?? []) {
      expect(size).toBeLessThan(smallestDeviceSize);
    }
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
