import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  extractRoutes,
  extractSitemapLocs,
  inspectTopShellData,
  isPendingStaticDeploy,
  isShellBrandExempt,
  resolveDestinationForSource,
  SHELL_BRAND_EXEMPT_SOURCES,
  shouldAllowDestinationFallback,
  sourcePathFromSitemapLoc,
  staticAssetPathFor,
} from "./audit-app-zone-shell.mjs";

const visibleTopElement = (overrides = {}) => ({
  textContent: "",
  ariaLabel: "",
  alt: "",
  rect: {
    width: 100,
    height: 40,
    top: 0,
    bottom: 40,
  },
  style: {
    display: "block",
    visibility: "visible",
    opacity: "1",
  },
  ...overrides,
});

describe("extractRoutes", () => {
  test("normalizes country routes and skips internal or wildcard zones", () => {
    const source = `
      { source: "/:countryId/marriage", destination: "https://marriage.example.com" },
      { source: "/us/salternative", destination: "https://salt.example.com/us/salternative" },
      { source: "/us/salternative", destination: "https://new-salt.example.com/us/salternative" },
      {
        source: "/us/pe84",
        destination: "https://pe84.example.com/us/pe84/calculator",
        deepDestination: "https://pe84.example.com/us/pe84/:path*",
      },
      { source: "/api/:path*", destination: "https://api.example.com/:path*" },
      { source: "/us/_zones/foo", destination: "https://example.com/_zones/foo" },
      { source: "/us/:slug", destination: "https://example.com/:slug" },
    `;

    assert.deepEqual(extractRoutes(source), [
      {
        source: "/us/marriage",
        destination: "https://marriage.example.com",
      },
      {
        source: "/us/pe84",
        destination: "https://pe84.example.com/us/pe84/calculator",
        deepDestination: "https://pe84.example.com/us/pe84/:path*",
      },
      {
        source: "/us/salternative",
        destination: "https://new-salt.example.com/us/salternative",
      },
    ]);
  });
});

describe("sitemap route mapping", () => {
  const route = {
    source: "/us/working-parents-tax-relief-act",
    destination: "https://wptra.vercel.app/us/working-parents-tax-relief-act",
  };

  test("extracts loc entries from sitemap XML", () => {
    assert.deepEqual(
      extractSitemapLocs(`
        <urlset>
          <url><loc>https://policyengine.org/us/a</loc></url>
          <url><loc>
            https://policyengine.org/us/b
          </loc></url>
        </urlset>
      `),
      ["https://policyengine.org/us/a", "https://policyengine.org/us/b"],
    );
  });

  test("maps source and destination locs back to policyengine.org source paths", () => {
    assert.equal(
      sourcePathFromSitemapLoc(
        "https://policyengine.org/us/working-parents-tax-relief-act#impact",
        route,
        "https://policyengine.org",
      ),
      "/us/working-parents-tax-relief-act#impact",
    );
    assert.equal(
      sourcePathFromSitemapLoc(
        "https://wptra.vercel.app/us/working-parents-tax-relief-act/calculator?tab=policy&amp;x=1#aggregate",
        route,
        "https://policyengine.org",
      ),
      "/us/working-parents-tax-relief-act/calculator?tab=policy&x=1#aggregate",
    );
  });

  test("preserves subpaths, search params, and hashes for destination fallback", () => {
    assert.equal(
      resolveDestinationForSource(
        route,
        "/us/working-parents-tax-relief-act/calculator?tab=policy#aggregate",
        "https://policyengine.org",
      ),
      "https://wptra.vercel.app/us/working-parents-tax-relief-act/calculator?tab=policy#aggregate",
    );
  });

  test("uses custom deepDestination templates for PR fallback URLs", () => {
    const pe84Route = {
      source: "/us/pe84",
      destination: "https://april-fools-2026-two.vercel.app/us/pe84/calculator",
      deepDestination: "https://april-fools-2026-two.vercel.app/us/pe84/:path*",
    };

    assert.equal(
      sourcePathFromSitemapLoc(
        "https://april-fools-2026-two.vercel.app/us/pe84/savings?view=chart#result",
        pe84Route,
        "https://policyengine.org",
      ),
      "/us/pe84/savings?view=chart#result",
    );
    assert.equal(
      resolveDestinationForSource(
        pe84Route,
        "/us/pe84/savings?view=chart#result",
        "https://policyengine.org",
      ),
      "https://april-fools-2026-two.vercel.app/us/pe84/savings?view=chart#result",
    );
    assert.equal(
      resolveDestinationForSource(
        pe84Route,
        "/us/pe84",
        "https://policyengine.org",
      ),
      "https://april-fools-2026-two.vercel.app/us/pe84/calculator",
    );
  });

  test("preserves static destination query params without leaking them into source paths", () => {
    const ukMarriageRoute = {
      source: "/uk/marriage",
      destination:
        "https://marriage-zeta-beryl.vercel.app/us/marriage?country=uk",
      deepDestination:
        "https://marriage-zeta-beryl.vercel.app/us/marriage/:path*?country=uk",
    };

    assert.equal(
      sourcePathFromSitemapLoc(
        "https://marriage-zeta-beryl.vercel.app/us/marriage/couples?country=uk&tab=chart#summary",
        ukMarriageRoute,
        "https://policyengine.org",
      ),
      "/uk/marriage/couples?tab=chart#summary",
    );
    assert.equal(
      resolveDestinationForSource(
        ukMarriageRoute,
        "/uk/marriage/couples?tab=chart#summary",
        "https://policyengine.org",
      ),
      "https://marriage-zeta-beryl.vercel.app/us/marriage/couples?country=uk&tab=chart#summary",
    );
  });
});

describe("inspectTopShellData", () => {
  test("requires the PolicyEngine brand and nav labels in visible top-shell elements", () => {
    const result = inspectTopShellData([
      visibleTopElement({
        ariaLabel: "PolicyEngine site header",
        textContent: "Research Model API Donate",
      }),
    ]);

    assert.equal(result.hasBrand, true);
    assert.deepEqual(result.navHits, ["Research", "Model", "API", "Donate"]);
  });

  test("ignores shell-looking content pushed below the top shell", () => {
    const result = inspectTopShellData([
      visibleTopElement({
        ariaLabel: "PolicyEngine site header",
        textContent: "Research Model API Donate",
        rect: { width: 100, height: 58, top: 471, bottom: 529 },
      }),
      visibleTopElement({
        textContent: "SALTernative Calculate",
      }),
    ]);

    assert.equal(result.hasBrand, false);
    assert.deepEqual(result.navHits, []);
  });

  test("ignores hidden and zero-size elements", () => {
    const result = inspectTopShellData([
      visibleTopElement({
        ariaLabel: "PolicyEngine site header",
        textContent: "Research Model API Donate",
        rect: { width: 0, height: 58, top: 0, bottom: 58 },
      }),
      visibleTopElement({
        ariaLabel: "PolicyEngine site header",
        textContent: "Research Model API Donate",
        style: { display: "none", visibility: "visible", opacity: "1" },
      }),
    ]);

    assert.equal(result.hasBrand, false);
    assert.deepEqual(result.navHits, []);
  });
});

describe("shouldAllowDestinationFallback", () => {
  test("defaults off outside pull requests", () => {
    assert.equal(shouldAllowDestinationFallback({}, {}), false);
  });

  test("enables fallback for explicit flag, env override, or pull request runs", () => {
    assert.equal(
      shouldAllowDestinationFallback(
        { "allow-destination-fallback": true },
        {},
      ),
      true,
    );
    assert.equal(
      shouldAllowDestinationFallback(
        {},
        { APP_ZONE_ALLOW_DESTINATION_FALLBACK: "1" },
      ),
      true,
    );
    assert.equal(
      shouldAllowDestinationFallback({}, { GITHUB_EVENT_NAME: "pull_request" }),
      true,
    );
  });
});

describe("isShellBrandExempt", () => {
  test("exempts nothing — every zone child renders its own shell", () => {
    // The list only ever shrinks; it drained to empty when the last nine
    // legacy children shipped their shells. Keep it empty: new zone embeds
    // must render the site shell from day one.
    assert.equal(SHELL_BRAND_EXEMPT_SOURCES.length, 0);
  });

  test("enforces the shell on formerly exempt and never-exempt routes alike", () => {
    assert.equal(isShellBrandExempt("/uk/scotland-income-tax-reform"), false);
    assert.equal(
      isShellBrandExempt("/uk/student-loan-visualisation/budget-impact"),
      false,
    );
    assert.equal(isShellBrandExempt("/us/obbba-household-explorer"), false);
    assert.equal(isShellBrandExempt("/uk/bus-fare-cap"), false);
    assert.equal(
      isShellBrandExempt("/us/snap-payment-error-simulator"),
      false,
    );
    assert.equal(isShellBrandExempt("/uk/marriage"), false);
  });
});

describe("staticAssetPathFor", () => {
  test("maps a repo-relative destination onto its static asset", () => {
    assert.equal(
      staticAssetPathFor("/assets/posts/some-post/index.html"),
      "app/public/assets/posts/some-post/index.html",
    );
  });

  test("ignores query strings and fragments", () => {
    assert.equal(
      staticAssetPathFor("/assets/posts/some-post/index.html?embed=true"),
      "app/public/assets/posts/some-post/index.html",
    );
    assert.equal(
      staticAssetPathFor("/assets/posts/some-post/index.html#impact"),
      "app/public/assets/posts/some-post/index.html",
    );
  });

  test("returns null for external destinations", () => {
    assert.equal(staticAssetPathFor("https://some-tool.vercel.app/us/x"), null);
    assert.equal(staticAssetPathFor("http://some-tool.vercel.app/us/x"), null);
    assert.equal(staticAssetPathFor("some-tool.vercel.app/us/x"), null);
  });
});

describe("isPendingStaticDeploy", () => {
  const present = () => true;
  const absent = () => false;
  const pendingRoute = {
    destination: "/assets/posts/some-post/index.html",
    status: 404,
    ok: false,
  };

  test("treats a 404 in-repo asset as pending when fallback is allowed", () => {
    assert.equal(
      isPendingStaticDeploy(pendingRoute, {
        allowDestinationFallback: true,
        exists: present,
      }),
      true,
    );
  });

  test("still fails on the production audit, which disables fallback", () => {
    // The scheduled run is the backstop: a route that never deploys must not
    // stay pending forever.
    assert.equal(
      isPendingStaticDeploy(pendingRoute, {
        allowDestinationFallback: false,
        exists: present,
      }),
      false,
    );
  });

  test("fails when the asset is missing from the checkout", () => {
    // A rewrite pointing at an asset nobody added is a broken route, not a
    // route awaiting deploy.
    assert.equal(
      isPendingStaticDeploy(pendingRoute, {
        allowDestinationFallback: true,
        exists: absent,
      }),
      false,
    );
  });

  test("does not excuse external destinations", () => {
    // External tools serve from their own origin before the rewrite lands, so
    // a 404 there is a real failure.
    assert.equal(
      isPendingStaticDeploy(
        { ...pendingRoute, destination: "https://some-tool.vercel.app/us/x" },
        { allowDestinationFallback: true, exists: present },
      ),
      false,
    );
  });

  test("does not excuse a live route that is missing the shell", () => {
    // 200 with no brand, or any non-404 error, is exactly what this audit
    // exists to catch.
    assert.equal(
      isPendingStaticDeploy(
        { ...pendingRoute, status: 200 },
        { allowDestinationFallback: true, exists: present },
      ),
      false,
    );
    assert.equal(
      isPendingStaticDeploy(
        { ...pendingRoute, status: 500 },
        { allowDestinationFallback: true, exists: present },
      ),
      false,
    );
  });

  test("leaves passing routes alone", () => {
    assert.equal(
      isPendingStaticDeploy(
        { ...pendingRoute, ok: true },
        { allowDestinationFallback: true, exists: present },
      ),
      false,
    );
  });
});
