// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const websiteDir = new URL("../../../", import.meta.url);

// website/vercel.json, read as Vercel reads it.
const websiteVercelConfig = JSON.parse(
  readFileSync(new URL("vercel.json", websiteDir), "utf8"),
);

/** The Vercel function glob that covers the household calculation route. */
const HOUSEHOLD_ROUTE_FUNCTIONS = "src/app/api/household/**/*";

/** The household calculation route's module, relative to website. */
const HOUSEHOLD_ROUTE_MODULE = "src/app/api/household/calculate/route.ts";

describe("website/vercel.json", () => {
  test("given a browser that goes away then Vercel cancels the household calculation route's request, so the route stops waiting for the Public API", () => {
    // Then
    expect(websiteVercelConfig.functions?.[HOUSEHOLD_ROUTE_FUNCTIONS]).toEqual({
      supportsCancellation: true,
    });
  });

  test("given the household calculation route's module then the cancellation glob's directory holds it", () => {
    // Given
    const globDirectory = HOUSEHOLD_ROUTE_FUNCTIONS.replace("/**/*", "/");

    // Then
    // Vercel doesn't check that a functions glob matches a file, so a moved
    // route would silently lose request cancellation.
    expect(HOUSEHOLD_ROUTE_MODULE.startsWith(globDirectory)).toBe(true);
    expect(existsSync(new URL(HOUSEHOLD_ROUTE_MODULE, websiteDir))).toBe(true);
  });
});
