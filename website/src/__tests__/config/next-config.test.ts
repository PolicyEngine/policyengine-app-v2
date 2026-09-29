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

describe("OBBBA household explorer routes", () => {
  const ORIGIN = "https://obbba-household-by-household.vercel.app";

  test("proxies the /us/obbba-households slug path-mounted to the child", async () => {
    const beforeFiles = await getBeforeFileRewrites();

    expect(beforeFiles).toContainEqual({
      source: "/us/obbba-households",
      destination: `${ORIGIN}/us/obbba-households`,
    });
    expect(beforeFiles).toContainEqual({
      source: "/us/obbba-households/:path*",
      destination: `${ORIGIN}/us/obbba-households/:path*`,
    });
  });

  test("proxies every OBBBA slug to the same path on the child", async () => {
    // The child is a SvelteKit app built for one base path; it only works
    // when the public path and the proxied path match.
    const beforeFiles = await getBeforeFileRewrites();
    const obbba = beforeFiles.filter((rewrite) =>
      rewrite.destination.startsWith(ORIGIN),
    );

    expect(obbba.length).toBeGreaterThan(0);
    for (const rewrite of obbba) {
      expect(rewrite.destination).toBe(`${ORIGIN}${rewrite.source}`);
    }
  });

  test("no longer proxies any old OBBBA slug", async () => {
    // The old slugs redirect (below); Next evaluates redirects before
    // beforeFiles rewrites, so a leftover proxy would be dead config.
    const beforeFiles = await getBeforeFileRewrites();

    expect(
      beforeFiles.filter((rewrite) =>
        /^\/us\/obbba-household-/.test(rewrite.source),
      ),
    ).toEqual([]);
  });

  test.each([
    "/us/obbba-household-explorer",
    "/us/obbba-household-by-household",
    "/us/obbba-scatter",
    "/us/obba-household-explorer",
  ])("308s %s and its subpaths to /us/obbba-households", async (source) => {
    const redirects = await getRedirects();

    expect(redirects).toContainEqual({
      source,
      destination: "/us/obbba-households",
      permanent: true,
    });
    expect(redirects).toContainEqual({
      source: `${source}/:path*`,
      destination: "/us/obbba-households/:path*",
      permanent: true,
    });
  });

  test.each([
    "/us/research/obbba-household-explorer",
    "/us/research/obbba-household-by-household",
  ])("308s the mis-prefixed link %s to the tool", async (source) => {
    const redirects = await getRedirects();

    expect(redirects).toContainEqual({
      source,
      destination: "/us/obbba-households",
      permanent: true,
    });
  });

  test("keeps the ob3-households vanity alias temporary", async () => {
    const redirects = await getRedirects();

    expect(redirects).toContainEqual({
      source: "/us/ob3-households",
      destination: "/us/obbba-households",
      permanent: false,
    });
    expect(redirects).toContainEqual({
      source: "/us/ob3-households/:path*",
      destination: "/us/obbba-households/:path*",
      permanent: false,
    });
  });

  test("never redirects away from /us/obbba-households", async () => {
    const redirects = await getRedirects();

    expect(
      redirects.filter(
        (redirect) =>
          redirect.source === "/us/obbba-households" ||
          redirect.source.startsWith("/us/obbba-households/"),
      ),
    ).toEqual([]);
  });

  test("only redirects old OBBBA slugs to a path that is proxied", async () => {
    const beforeFiles = await getBeforeFileRewrites();
    const redirects = await getRedirects();
    const proxied = new Set(beforeFiles.map((rewrite) => rewrite.source));
    const obbbaRedirects = redirects.filter((redirect) =>
      redirect.destination.startsWith("/us/obbba-household"),
    );

    expect(obbbaRedirects.length).toBeGreaterThan(0);
    for (const redirect of obbbaRedirects) {
      expect(proxied).toContain(redirect.destination);
    }
  });
});
