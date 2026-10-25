// @vitest-environment node
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import fc from "fast-check";
import postcss from "postcss";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import {
  checkBuiltCss,
  compareClasses,
  freshClasses,
  selectorClasses,
  stylesheetClasses,
  UTILITY_PREFIX,
} from "../../../../scripts/check-built-css.mjs";

// scripts/check-built-css.mjs runs after `next build` in both apps and fails a
// build whose CSS doesn't match a fresh Tailwind compile. Tailwind scans this
// file too, so utility names here are built at runtime from the prefix: a
// literal one would end up in the website's CSS.

const websiteDir = path.resolve(__dirname, "../../..");
const repoDir = path.resolve(websiteDir, "..");
const calculatorDir = path.join(repoDir, "calculator-app");
const script = path.join(repoDir, "scripts/check-built-css.mjs");
const P = UTILITY_PREFIX;

/** CSSOM's CSS.escape(), which Node lacks. */
function cssEscape(value: string): string {
  let out = "";
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    const digit = code >= 0x30 && code <= 0x39;
    if (code === 0) out += "\uFFFD";
    else if (
      (code >= 0x1 && code <= 0x1f) ||
      code === 0x7f ||
      (i === 0 && digit) ||
      (i === 1 && digit && value.charCodeAt(0) === 0x2d)
    ) {
      out += `\\${code.toString(16)} `;
    } else if (i === 0 && value.length === 1 && code === 0x2d) {
      out += `\\${value[i]}`;
    } else if (code >= 0x80 || /[\w-]/.test(value[i])) out += value[i];
    else out += `\\${value[i]}`;
  }
  return out;
}

/** Every code point as a hex escape: valid CSS, and nothing like a minifier's. */
function hexEscape(value: string): string {
  return [...value]
    .map((char) => `\\${char.codePointAt(0)!.toString(16)} `)
    .join("");
}

/** A rule per class, as a stylesheet a build might emit. */
function stylesheetFor(names: Iterable<string>): string {
  return [...names].map((name) => `.${cssEscape(name)}{color:red}`).join("\n");
}

const scratch: string[] = [];
afterAll(() => {
  for (const dir of scratch) rmSync(dir, { recursive: true, force: true });
});

/**
 * A directory for one test. Under node_modules/.cache, so the fixture app can
 * resolve postcss and Tailwind the way the real apps do.
 */
function scratchDir(): string {
  const parent = path.join(websiteDir, "node_modules/.cache");
  mkdirSync(parent, { recursive: true });
  const dir = mkdtempSync(path.join(parent, "check-built-css-"));
  scratch.push(dir);
  return dir;
}

/** A built-CSS directory holding these files, nested ones included. */
function cssDirWith(files: Record<string, string>): string {
  const dir = scratchDir();
  for (const [name, css] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
    writeFileSync(path.join(dir, name), css);
  }
  return dir;
}

function runScript(...args: string[]) {
  const result = spawnSync(
    process.execPath,
    ["--no-deprecation", script, ...args],
    { encoding: "utf8" },
  );
  return { code: result.status, output: result.stdout + result.stderr };
}

describe("selectorClasses", () => {
  // Any class names, escaped as CSSOM does or as all-hex escapes, in any
  // selector shape, come back exactly, in order. Dots in strings and escaped
  // dots, as in IDs and attribute values, aren't classes.
  test("given any selector then it returns exactly the classes it names", () => {
    const name = fc
      .string({ unit: "grapheme", minLength: 1, maxLength: 10 })
      .filter((text) => !text.includes("\0"));
    const part = fc.record({
      name,
      escape: fc.constantFrom(cssEscape, hexEscape),
      before: fc.constantFrom("", "div", "#main", "#id\\.x", "*"),
      after: fc.constantFrom(
        "",
        ":hover",
        "::after",
        '[data-x=".fake"]',
        "[data-x=a\\.b]",
        "[title='a.b' i]",
        ':lang("en.x")',
        ":nth-child(2n+1)",
        ":not(#id\\.y)",
      ),
      wrap: fc.constantFrom("", ":is", ":not", ":where"),
      join: fc.constantFrom(" ", " > ", " + ", " ~ ", ", ", ""),
    });

    fc.assert(
      fc.property(fc.array(part, { minLength: 1, maxLength: 4 }), (parts) => {
        const selector = parts
          .map((p, i) => {
            // A type or ID selector can't follow a class in one compound.
            const before = i > 0 && parts[i - 1].join === "" ? "" : p.before;
            const cls = `.${p.escape(p.name)}`;
            const simple = p.wrap ? `${p.wrap}(${cls})` : cls;
            return `${before}${simple}${p.after}${i < parts.length - 1 ? p.join : ""}`;
          })
          .join("");

        expect(selectorClasses(selector)).toEqual(parts.map((p) => p.name));
      }),
      { numRuns: 500 },
    );
  });

  test.each([
    [".a\\:b", ["a:b"]],
    [".\\31 0", ["10"]],
    [".\\000031x", ["1x"]],
    [".a\\\r\nb", ["a"]],
    [".\\d800", ["\uFFFD"]],
    [".\\110000", ["\uFFFD"]],
    [".x\\", ["x\uFFFD"]],
    ["[unclosed='.a", []],
    [".", []],
  ])("given %j then it returns %j", (selector, names) => {
    expect(selectorClasses(selector)).toEqual(names);
  });
});

describe("stylesheetClasses", () => {
  test("given nested rules then it counts them, and keyframe steps aren't classes", () => {
    const root = postcss.parse(`
      .a { color: red }
      @media (min-width: 1px) { .b { color: red } }
      @supports (display: grid) { @layer x { .c, .d:hover { color: red } } }
      @keyframes spin { 12.5% { opacity: 0 } to { opacity: 1 } }
      @-webkit-keyframes spin { 33.3% { opacity: 0 } }
    `);

    expect([...stylesheetClasses(root)].sort()).toEqual(["a", "b", "c", "d"]);
  });
});

describe("compareClasses", () => {
  // For any two class sets: missing is exactly fresh minus built, and what
  // only the build has splits into utilities (by prefix) and other CSS.
  test("given any class sets then it partitions their difference by prefix", () => {
    const names = fc.uniqueArray(
      fc.oneof(
        fc.string({ minLength: 1, maxLength: 4 }),
        fc.string({ minLength: 1, maxLength: 4 }).map((n) => `${P}${n}`),
      ),
    );

    fc.assert(
      fc.property(names, names, (freshList, builtList) => {
        const fresh = new Set(freshList);
        const built = new Set(builtList);

        const { missing, staleUtilities, otherCss } = compareClasses(
          fresh,
          built,
        );

        const sorted = (list: string[]) => [...list].sort();
        expect(missing).toEqual(sorted(freshList.filter((n) => !built.has(n))));
        const onlyBuilt = sorted(builtList.filter((n) => !fresh.has(n)));
        expect(staleUtilities).toEqual(
          onlyBuilt.filter((n) => n.startsWith(P)),
        );
        expect(otherCss).toEqual(onlyBuilt.filter((n) => !n.startsWith(P)));
      }),
      { numRuns: 300 },
    );
  });
});

describe("freshClasses", () => {
  test("given an app outside the working directory then Tailwind scans that app", async () => {
    // Given: a one-utility app; the tests run from website/, which has hundreds
    const app = scratchDir();
    const utility = `${P}mt-[1234.5px]`;
    writeFileSync(
      path.join(app, "globals.css"),
      `@import "tailwindcss" prefix(tw);\n.fixture-rule { color: red; }\n`,
    );
    writeFileSync(path.join(app, "package.json"), '{ "private": true }');
    mkdirSync(path.join(app, "src"));
    writeFileSync(
      path.join(app, "src/page.tsx"),
      `export const page = <div className="${utility}" />;\n`,
    );

    // When
    const classes = await freshClasses(app, "globals.css");

    // Then
    expect([...classes].sort()).toEqual(["fixture-rule", utility]);
  });

  test("given the website and the calculator then each compile scans its own app", async () => {
    // When
    const website = await freshClasses(websiteDir, "src/app/globals.css");
    const calculator = await freshClasses(calculatorDir, "src/app/globals.css");

    // Then: each has utilities the other's source never uses
    const only = (a: Set<string>, b: Set<string>) =>
      [...a].filter((name) => name.startsWith(P) && !b.has(name));
    expect(only(website, calculator).length).toBeGreaterThan(0);
    expect(only(calculator, website).length).toBeGreaterThan(0);
  }, 60_000);
});

describe("checkBuiltCss on the website's source", () => {
  let fresh: Set<string>;
  let utility: string;
  beforeAll(async () => {
    fresh = await freshClasses(websiteDir, "src/app/globals.css");
    utility = [...fresh].find((name) => name.startsWith(P))!;
  }, 60_000);

  const check = (cssDir: string) =>
    checkBuiltCss({
      appDir: websiteDir,
      stylesheet: "src/app/globals.css",
      cssDir,
    });

  test("given a build with every class, split across nested files, then nothing is missing", async () => {
    // Given
    const names = [...fresh];
    const half = Math.ceil(names.length / 2);
    const cssDir = cssDirWith({
      "a.css": stylesheetFor(names.slice(0, half)),
      "app/b.css": stylesheetFor([...names.slice(half), "rich-text-block"]),
    });

    // When
    const result = await check(cssDir);

    // Then
    expect(result).toMatchObject({
      missing: [],
      staleUtilities: [],
      otherCss: ["rich-text-block"],
      fresh: fresh.size,
    });
    expect(result.files).toHaveLength(2);
  });

  test("given a build missing a class then it reports that class", async () => {
    // Given
    const cssDir = cssDirWith({
      "a.css": stylesheetFor([...fresh].filter((name) => name !== utility)),
    });

    // When
    const result = await check(cssDir);

    // Then
    expect(result.missing).toEqual([utility]);
  });

  test("given a build with a utility the source doesn't use then it reports it as stale", async () => {
    // Given
    const stale = `${P}mt-[4321.5px]`;
    const cssDir = cssDirWith({ "a.css": stylesheetFor([...fresh, stale]) });

    // When
    const result = await check(cssDir);

    // Then
    expect(result).toMatchObject({ missing: [], staleUtilities: [stale] });
  });

  test("given no built CSS then it throws", async () => {
    await expect(check(cssDirWith({ "a.js": "" }))).rejects.toThrow(
      /No CSS files/,
    );
  });

  test("given a stylesheet whose compile has no utilities then it throws", async () => {
    // Given: an app whose source uses none, so any build would look complete
    const app = scratchDir();
    writeFileSync(
      path.join(app, "globals.css"),
      `@import "tailwindcss" prefix(tw);\n`,
    );
    writeFileSync(path.join(app, "package.json"), '{ "private": true }');

    // When / Then
    await expect(
      checkBuiltCss({
        appDir: app,
        stylesheet: "globals.css",
        cssDir: cssDirWith({ "a.css": ".a{color:red}" }),
      }),
    ).rejects.toThrow(/no tw: utilities/);
  });

  test("given the command line then it exits 0 for a full build and 1 for a stale one", () => {
    const full = cssDirWith({ "a.css": stylesheetFor(fresh) });
    const missing = cssDirWith({
      "a.css": stylesheetFor([...fresh].filter((name) => name !== utility)),
    });
    const stale = cssDirWith({
      "a.css": stylesheetFor([...fresh, `${P}mt-[4321.5px]`]),
    });
    const args = [websiteDir, "src/app/globals.css"];

    expect(runScript(...args, full).code).toBe(0);

    const missingRun = runScript(...args, missing);
    expect(missingRun.code).toBe(1);
    expect(missingRun.output).toContain("1 class the source uses is missing");
    expect(missingRun.output).toContain(utility);

    const staleRun = runScript(...args, stale);
    expect(staleRun.code).toBe(1);
    expect(staleRun.output).toContain(`${P}mt-[4321.5px]`);

    expect(runScript().code).toBe(2);
  }, 60_000);
});

describe("build scripts", () => {
  test("given the website build then it clears webpack's packs, builds, then checks the CSS", () => {
    const lines = readFileSync(
      path.join(websiteDir, "scripts/build.sh"),
      "utf8",
    )
      .split("\n")
      .map((line) => line.trim());

    const clear = lines.indexOf("rm -rf .next/cache/webpack");
    const build = lines.indexOf("bun run build:next");
    const checkLine = lines.indexOf(
      "node ../scripts/check-built-css.mjs . src/app/globals.css",
    );
    expect(clear).toBeGreaterThan(lines.indexOf('cd "$WEBSITE_ROOT"'));
    expect(build).toBeGreaterThan(clear);
    expect(checkLine).toBeGreaterThan(build);
  });

  test("given the calculator build then it checks the CSS after next build", () => {
    const { scripts } = JSON.parse(
      readFileSync(path.join(calculatorDir, "package.json"), "utf8"),
    ) as { scripts: Record<string, string> };

    expect(scripts.build).toBe(
      "next build && node ../scripts/check-built-css.mjs . src/app/globals.css",
    );
  });
});
