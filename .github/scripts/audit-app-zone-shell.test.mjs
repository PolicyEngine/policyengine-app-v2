import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  extractRoutes,
  extractSitemapLocs,
  inspectTopShellData,
  resolveDestinationForSource,
  shouldAllowDestinationFallback,
  sourcePathFromSitemapLoc,
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
    assert.equal(shouldAllowDestinationFallback({ "allow-destination-fallback": true }, {}), true);
    assert.equal(
      shouldAllowDestinationFallback({}, { APP_ZONE_ALLOW_DESTINATION_FALLBACK: "1" }),
      true,
    );
    assert.equal(
      shouldAllowDestinationFallback({}, { GITHUB_EVENT_NAME: "pull_request" }),
      true,
    );
  });
});
