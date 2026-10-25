// @vitest-environment node
import type { NextConfig } from "next";
import { describe, expect, test } from "vitest";

import nextConfig from "../../../next.config";

// Tailwind builds the CSS from every file it scans, but a production build
// that restored webpack's persistent cache kept CSS compiled from older source
// when only a server component had changed, so new classes never shipped.
// Production builds therefore run without the cache.

type WebpackHook = NonNullable<NextConfig["webpack"]>;

/** A webpack config shaped like the one Next passes to the hook. */
function webpackConfig() {
  return { cache: { type: "filesystem" }, plugins: [] as unknown[] };
}

/** The parts of Next's hook context the hook reads. */
function context(dev: boolean, isServer: boolean) {
  return { dev, isServer } as unknown as Parameters<WebpackHook>[1];
}

describe("nextConfig webpack cache", () => {
  test.each([false, true])(
    "given a production build (server: %s) then webpack runs without its cache",
    (isServer) => {
      const out = nextConfig.webpack!(
        webpackConfig(),
        context(false, isServer),
      );

      expect(out.cache).toBe(false);
    },
  );

  test("given a dev build then webpack keeps its cache", () => {
    const out = nextConfig.webpack!(webpackConfig(), context(true, false));

    expect(out.cache).toEqual({ type: "filesystem" });
  });

  test("leaves the rest of the config alone", () => {
    const config = webpackConfig();
    const out = nextConfig.webpack!(config, context(false, false));

    expect(out).toBe(config);
    expect(out.plugins).toEqual([]);
  });
});
