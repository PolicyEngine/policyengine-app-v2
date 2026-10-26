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
    // there sets the options. Nor does any mention `.managedPaths`,
    // `.unmanagedPaths`, `.immutablePaths` or `.fileSystemInfo`: webpack builds
    // those from the options, and a plugin could change them without naming
    // the options.
    const buildDir = path.dirname(configFile);
    const files = readdirSync(buildDir, {
      encoding: "utf8",
      recursive: true,
    }).filter((file) => file.endsWith(".js"));
    const read = (file: string) =>
      readFileSync(path.join(buildDir, file), "utf8");
    const mentions = files.filter((file) => {
      const rest =
        file === "webpack-config.js"
          ? read(file).replace(raw!, "")
          : read(file);
      return /\bsnapshot\b|\.(?:(?:un)?managedPaths|immutablePaths|fileSystemInfo)\b/.test(
        rest,
      );
    });
    expect(mentions).toEqual([]);
    // Next sets webpack's mode in one place, base.js, to production for
    // `next build`; the mode picks webpack's default snapshot.module. The other
    // `.mode` assignments in its build code are a fetch polyfill's and
    // css-loader's CSS-modules mode.
    const modeAssignments = Object.fromEntries(
      files
        .map((file) => [
          file,
          read(file).match(/[\w$.]+\.mode\s*=(?!=)[^,;\n]*/g) ?? [],
        ])
        .filter(([, found]) => found.length > 0),
    );
    expect(modeAssignments).toEqual({
      [path.join("polyfills", "polyfill-nomodule.js")]: [
        "this.mode=t.mode",
        "this.mode=e.mode||this.mode||null",
      ],
      [path.join("webpack", "config", "blocks", "base.js")]: [
        "config.mode = ctx.isDevelopment ? 'development' : 'production'",
      ],
      [path.join("webpack", "loaders", "css-loader", "src", "index.js")]: [
        "modulesOptions.mode = typeof rawOptions.modules === 'string' ? rawOptions.modules : 'local'",
        "modulesOptions.mode = modulesOptions.mode(loaderContext.resourcePath)",
      ],
    });
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

  // Next calls each app's webpack hook after that block, once for each of its
  // compilations, so a hook could still change what webpack gets: the snapshot
  // options, `mode` (which picks webpack's default snapshot.module), or a
  // plugin that changes the managed paths. So each hook's config, run through
  // Next's webpack, must end with the snapshot settings of the config it got.
  test.each(
    (
      [
        ["website", nextConfig],
        ["calculator", calculatorConfig],
      ] as const
    ).flatMap(([app, config]) =>
      (
        [
          ["client", { isServer: false }],
          ["server", { isServer: true, nextRuntime: "nodejs" }],
          ["edge server", { isServer: true, nextRuntime: "edge" }],
        ] as const
      ).map(([name, compilation]) => [app, name, config, compilation] as const),
    ),
  )(
    "given the %s's webpack hook for the %s then it leaves the snapshot settings alone",
    (_, __, config, compilation) => {
      const require = createRequire(path.join(repoDir, "website/package.json"));
      const { webpack } = require("next/dist/compiled/webpack/bundle5")();
      // What webpack's FileSystemInfo gets for a config's compilation.
      const settings = (webpackConfig: object) => {
        const compiler = webpack({
          ...webpackConfig,
          context: repoDir,
          entry: "./package.json",
          cache: false,
          optimization: { minimize: false },
        });
        compiler.newCompilation(compiler.newCompilationParams());
        return {
          options: compiler.options.snapshot,
          managedPaths: [...compiler.managedPaths],
          immutablePaths: [...compiler.immutablePaths],
          unmanagedPaths: [...compiler.unmanagedPaths],
        };
      };
      const given = () => ({
        mode: "production",
        snapshot: { managedPaths: [...NEXT_MANAGED_PATHS] },
        cache: { type: "filesystem" },
        module: { rules: [] },
        plugins: [],
        resolve: {},
      });
      const ctx = {
        dev: false,
        ...compilation,
        webpack,
      } as unknown as Parameters<WebpackHook>[1];
      expect(settings(config.webpack!(given(), ctx))).toEqual(
        settings(given()),
      );
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
