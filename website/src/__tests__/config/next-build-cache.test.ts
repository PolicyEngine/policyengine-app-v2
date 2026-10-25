// @vitest-environment node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
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

const repoDir = path.resolve(__dirname, "../../../..");

/**
 * The directories Tailwind reports for an app's stylesheet as dir-dependency
 * messages: what Next's PostCSS loader makes webpack snapshot.
 */
async function tailwindDirectories(app: string): Promise<string[]> {
  const appDir = path.join(repoDir, app);
  const require = createRequire(path.join(appDir, "package.json"));
  const postcss = require("postcss");
  const tailwindcss = require("@tailwindcss/postcss");
  const from = path.join(appDir, "src/app/globals.css");
  const result = await postcss([tailwindcss({ base: appDir })]).process(
    readFileSync(from, "utf8"),
    // Tailwind's PostCSS plugin caches by file, so each app gets its own.
    { from: from.replace(/\.css$/, `-dirs-${app}.css`) },
  );
  return result.messages
    .filter((message: { type: string }) => message.type === "dir-dependency")
    .map((message: { dir: string }) => message.dir);
}

/** Every symlink to a file under `dir`, relative to the repo. */
function fileSymlinks(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) {
      return statSync(full).isFile() ? [path.relative(repoDir, full)] : [];
    }
    if (entry.isDirectory() && entry.name !== "node_modules") {
      return fileSymlinks(full);
    }
    return [];
  });
}

// The calculator keeps webpack's cache, which is safe only while webpack can
// snapshot every directory Tailwind scans for it.
describe("Tailwind's source directories", () => {
  test("given the website then they hold its data symlinks, which is why its cache is off", async () => {
    const links = (await tailwindDirectories("website")).flatMap(fileSymlinks);
    expect(links).toContain("website/src/data/apps.json");
  }, 30_000);

  test("given the calculator, which keeps webpack's cache, then none holds a symlink to a file", async () => {
    const directories = await tailwindDirectories("calculator-app");
    expect(directories.map((dir) => path.relative(repoDir, dir))).toEqual(
      expect.arrayContaining(["app/src", "calculator-app/src"]),
    );
    expect(directories.flatMap(fileSymlinks)).toEqual([]);
  }, 30_000);
});
