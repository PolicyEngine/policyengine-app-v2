import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  LEGACY_VERCEL_JSON_ZONE_SLUGS,
  extractZoneSlug,
  isZoneShaped,
  findUnauthorizedZoneRewrites,
} from "./guard-vercel-zone-rewrites.mjs";

describe("extractZoneSlug", () => {
  test("extracts the slug after /us or /uk", () => {
    assert.equal(extractZoneSlug("/us/taxsim"), "taxsim");
    assert.equal(extractZoneSlug("/uk/api"), "api");
    assert.equal(extractZoneSlug("/us/oregon-kicker-refund"), "oregon-kicker-refund");
  });

  test("strips deep-path suffixes", () => {
    assert.equal(extractZoneSlug("/us/taxsim/:path*"), "taxsim");
    assert.equal(extractZoneSlug("/uk/api/"), "api");
    assert.equal(extractZoneSlug("/us/california-wealth-tax/embed"), "california-wealth-tax");
  });

  test("handles parameterized country prefixes", () => {
    assert.equal(extractZoneSlug("/:countryId/model"), "model");
    assert.equal(extractZoneSlug("/:countryId/model/:path*"), "model");
  });

  test("returns null for non-zone sources", () => {
    assert.equal(extractZoneSlug("/robots.txt"), null);
    assert.equal(extractZoneSlug("/slides/:path*"), null);
    assert.equal(extractZoneSlug("/(.*)"), null);
    assert.equal(extractZoneSlug("/_tracker/:path*"), null);
    assert.equal(extractZoneSlug(""), null);
    assert.equal(extractZoneSlug(undefined), null);
  });
});

describe("isZoneShaped", () => {
  test("flags country-prefixed sources pointing at vercel.app", () => {
    assert.equal(
      isZoneShaped({ source: "/us/taxsim", destination: "https://taxsim.vercel.app/us/taxsim" }),
      true,
    );
    assert.equal(
      isZoneShaped({
        source: "/uk/api/:path*",
        destination: "https://household-api-docs-policy-engine.vercel.app/uk/api/:path*",
      }),
      true,
    );
  });

  test("ignores non-vercel.app destinations", () => {
    assert.equal(
      isZoneShaped({
        source: "/us/something",
        destination: "https://policyengine.org/us/something",
      }),
      false,
    );
    assert.equal(
      isZoneShaped({
        source: "/_tracker/:path*",
        destination: "https://something.modal.run/_tracker/:path*",
      }),
      false,
    );
  });

  test("ignores non-country-prefixed sources even when destination is vercel.app", () => {
    assert.equal(
      isZoneShaped({
        source: "/slides/:path*",
        destination: "https://policyengine-slides.vercel.app/slides/:path*",
      }),
      false,
    );
  });

  test("tolerates malformed inputs", () => {
    assert.equal(isZoneShaped(null), false);
    assert.equal(isZoneShaped({}), false);
    assert.equal(isZoneShaped({ source: "/us/x", destination: "not-a-url" }), false);
  });
});

describe("findUnauthorizedZoneRewrites", () => {
  const legacyRewrite = {
    source: "/us/taxsim",
    destination: "https://policyengine-taxsim-policy-engine.vercel.app/us/taxsim",
  };
  const newRewrite = {
    source: "/us/qbi-calculator",
    destination: "https://qbi-visualizer.vercel.app/us/qbi-calculator",
  };

  test("returns nothing when all zone rewrites are on the allowlist", () => {
    assert.deepEqual(findUnauthorizedZoneRewrites([legacyRewrite]), []);
  });

  test("flags rewrites whose slug isn't on the allowlist", () => {
    const result = findUnauthorizedZoneRewrites([legacyRewrite, newRewrite]);
    assert.deepEqual(result, [newRewrite]);
  });

  test("accepts a custom allowlist", () => {
    const allowed = new Set(["qbi-calculator"]);
    assert.deepEqual(findUnauthorizedZoneRewrites([newRewrite], allowed), []);
  });

  test("ignores non-array input", () => {
    assert.deepEqual(findUnauthorizedZoneRewrites(undefined), []);
    assert.deepEqual(findUnauthorizedZoneRewrites(null), []);
  });
});

describe("LEGACY_VERCEL_JSON_ZONE_SLUGS", () => {
  test("matches the current main snapshot exactly", () => {
    // If this assertion fails, you've either added a new zone rewrite to
    // vercel.json (route it through appZoneRoutes.ts instead) or migrated
    // a legacy one to appZoneRoutes.ts (drop the slug from this set).
    assert.deepEqual(
      [...LEGACY_VERCEL_JSON_ZONE_SLUGS].sort(),
      [
        "api",
        "california-wealth-tax",
        "keep-your-pay-act",
        "model",
        "oregon-kicker-refund",
        "taxsim",
        "watca",
      ],
    );
  });
});
