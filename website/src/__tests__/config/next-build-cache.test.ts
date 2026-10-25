// @vitest-environment node
import type { NextConfig } from "next";
import { describe, expect, test } from "vitest";

import nextConfig from "../../../next.config";

// A production build that restored webpack's persistent cache reused old CSS,
// because webpack can't snapshot src/ while src/data holds symlinks to files.
// See the note above `webpack` in next.config.ts.

type WebpackHook = NonNullable<NextConfig["webpack"]>;

/** A webpack config shaped like the one Next passes to the hook. */
function webpackConfig() {
  return { cache: { type: "filesystem" } };
}

/** The parts of Next's hook context the hook reads. */
function context(dev: boolean, isServer: boolean) {
  return { dev, isServer } as unknown as Parameters<WebpackHook>[1];
}

describe("nextConfig webpack cache", () => {
  test.each([
    ["the client", false],
    ["the server", true],
  ])(
    "given a production build of %s then webpack runs without its cache",
    (_, isServer) => {
      // Given
      const config = webpackConfig();

      // When
      const out = nextConfig.webpack!(config, context(false, isServer));

      // Then
      expect(out).toBe(config);
      expect(out.cache).toBe(false);
    },
  );

  test("given a webpack dev build then the hook leaves Next's cache in place", () => {
    // Given: `next dev` without --turbopack, which this repo's scripts don't use
    const config = webpackConfig();

    // When
    const out = nextConfig.webpack!(config, context(true, false));

    // Then: rebuilds while editing stay incremental
    expect(out.cache).toEqual({ type: "filesystem" });
  });

  test("given the webpack hook then Next still runs each compilation in a build worker", () => {
    // Next turns the workers off when a config has a webpack hook, unless
    // they're asked for.
    expect(nextConfig.experimental?.webpackBuildWorker).toBe(true);
  });
});
