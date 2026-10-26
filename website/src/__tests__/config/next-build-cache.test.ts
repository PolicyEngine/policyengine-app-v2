// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import type { NextConfig } from "next";
import { describe, expect, test } from "vitest";

import calculatorConfig from "../../../../calculator-app/next.config";
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

type SnapshotCallback = (error: Error | null, snapshot: unknown) => void;

/**
 * The managedPaths Next gives webpack outside Yarn PnP, copied from
 * next/dist/build/webpack-config.js. The verdicts depend on them: webpack
 * snapshots a package under a managed path by its package.json, so it never
 * reads a link inside one. A test below fails if Next's copy changes.
 */
const NEXT_MANAGED_PATHS = [/^(.+?[\\/]node_modules[\\/])/];

/**
 * The directories, of those given, that webpack can't snapshot for a
 * production build, relative to the repo. It asks the webpack bundled with
 * Next, with the snapshot options a production build uses and Next's
 * managedPaths, instead of re-deriving webpack's rules for symlinks. A null
 * snapshot is the failure: webpack then drops the module's dependencies, so a
 * restored cache counts as valid whatever changed.
 */
async function unsnapshottable(dirs: string[]): Promise<string[]> {
  const require = createRequire(path.join(repoDir, "website/package.json"));
  const { webpack } = require("next/dist/compiled/webpack/bundle5")();
  const compiler = webpack({
    mode: "production",
    context: repoDir,
    entry: "./package.json",
    cache: false,
    // Production mode would otherwise load Next's minifier, unused here.
    optimization: { minimize: false },
    snapshot: { managedPaths: NEXT_MANAGED_PATHS },
  });
  const { fileSystemInfo } = compiler.newCompilation(
    compiler.newCompilationParams(),
  );
  const options = compiler.options.snapshot.module;
  const failed = await Promise.all(
    dirs.map(
      (dir) =>
        new Promise<string[]>((resolve, reject) => {
          const done: SnapshotCallback = (error, snapshot) =>
            error
              ? reject(error)
              : resolve(snapshot === null ? [path.relative(repoDir, dir)] : []);
          fileSystemInfo.createSnapshot(
            Date.now(),
            [],
            [dir],
            [],
            options,
            done,
          );
        }),
    ),
  );
  return failed.flat();
}

describe("Tailwind's source directories", () => {
  test("given Next's build config then it sets only the snapshot paths the oracle copies", () => {
    // Next replaces webpack's snapshot options with this block, whitespace
    // aside, and sets them nowhere else. Outside Yarn PnP it sets only
    // managedPaths, and no snapshot.module, so a build gets webpack's
    // production default for that (the next test).
    const require = createRequire(path.join(repoDir, "website/package.json"));
    const configFile = require.resolve("next/dist/build/webpack-config.js");
    const source = readFileSync(configFile, "utf8");
    const raw = source.match(
      /webpack5Config\.snapshot = \{\};[\s\S]*?\n\s*if \(dev\) \{/,
    )?.[0];
    const block = raw?.replace(/\s+/g, " ");
    expect(block).toBe(
      [
        "webpack5Config.snapshot = {};",
        "if (process.versions.pnp === '3') {",
        String.raw`webpack5Config.snapshot.managedPaths = [ /^(.+?(?:[\\/]\.yarn[\\/]unplugged[\\/][^\\/]+)?[\\/]node_modules[\\/])/ ];`,
        "} else {",
        `webpack5Config.snapshot.managedPaths = [ ${NEXT_MANAGED_PATHS[0]} ];`,
        "}",
        "if (process.versions.pnp === '3') {",
        String.raw`webpack5Config.snapshot.immutablePaths = [ /^(.+?[\\/]cache[\\/][^\\/]+\.zip[\\/]node_modules[\\/])/ ];`,
        "}",
        "if (dev) {",
      ].join(" "),
    );
    // No other line of Next's build code mentions `snapshot`, so nothing else
    // there sets the options.
    const buildDir = path.dirname(configFile);
    const mentions = readdirSync(buildDir, {
      encoding: "utf8",
      recursive: true,
    })
      .filter((file) => file.endsWith(".js"))
      .filter((file) => {
        const text = readFileSync(path.join(buildDir, file), "utf8");
        const rest =
          file === "webpack-config.js" ? text.replace(raw!, "") : text;
        return /\bsnapshot\b/.test(rest);
      });
    expect(mentions).toEqual([]);
    expect(process.versions.pnp).toBeUndefined();
    // The calculator's build reads this same copy of Next.
    const calculator = createRequire(
      path.join(repoDir, "calculator-app/package.json"),
    );
    expect(calculator.resolve("next/dist/build/webpack-config.js")).toBe(
      configFile,
    );
  });

  test("given a production build then webpack snapshots modules by timestamp and hash", async () => {
    // What unsnapshottable() passes on; a change here could change its verdicts.
    const require = createRequire(path.join(repoDir, "website/package.json"));
    const { webpack } = require("next/dist/compiled/webpack/bundle5")();
    const compiler = webpack({
      mode: "production",
      entry: "./package.json",
      optimization: { minimize: false },
    });
    expect(compiler.options.snapshot.module).toEqual({
      timestamp: true,
      hash: true,
    });
  });

  // Next calls each app's webpack hook after that block, so a hook could still
  // change what webpack gets. Each returns the snapshot options it was given,
  // unchanged (they're frozen, so a change in place throws). Each also keeps
  // `mode`, which picks webpack's default snapshot.module, and sets no
  // experiments.futureDefaults, which changes webpack's snapshot defaults.
  test.each([
    ["website", nextConfig],
    ["calculator", calculatorConfig],
  ])(
    "given the %s's webpack hook then it leaves the snapshot options alone",
    (_, config) => {
      const snapshot = Object.freeze({
        managedPaths: Object.freeze([...NEXT_MANAGED_PATHS]),
      });
      const given = {
        mode: "production",
        snapshot,
        cache: { type: "filesystem" },
        plugins: [],
        resolve: {},
      };
      const ctx = {
        dev: false,
        isServer: false,
        webpack: { DefinePlugin: class {} },
      } as unknown as Parameters<WebpackHook>[1];
      const out = config.webpack!(given, ctx);
      expect(out.snapshot).toBe(snapshot);
      expect(out.mode).toBe("production");
      expect(out.experiments?.futureDefaults).toBeUndefined();
    },
  );

  // The positive control. If a Next upgrade lets webpack snapshot website/src,
  // this fails, and the website's cache could come back.
  test("given the website then webpack can't snapshot src, which is why its cache is off", async () => {
    const directories = await tailwindDirectories("website");
    expect(await unsnapshottable(directories)).toEqual(["website/src"]);
  }, 30_000);

  // The calculator keeps webpack's cache, which is safe only while webpack can
  // snapshot every directory Tailwind scans for it.
  test("given the calculator, which keeps webpack's cache, then webpack can snapshot every one", async () => {
    const directories = await tailwindDirectories("calculator-app");
    expect(directories.map((dir) => path.relative(repoDir, dir))).toEqual(
      expect.arrayContaining(["app/src", "calculator-app/src"]),
    );
    expect(await unsnapshottable(directories)).toEqual([]);
  }, 30_000);
});
