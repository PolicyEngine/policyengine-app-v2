// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fc from "fast-check";
import { describe, expect, test } from "vitest";

const srcDir = fileURLToPath(new URL("../..", import.meta.url));
const globalsPath = path.join(srcDir, "app/globals.css");

/** Where an @import points, read from the importing stylesheet. */
function resolveStylesheet(specifier: string, from: string): string {
  if (specifier.startsWith(".")) {
    return path.resolve(path.dirname(from), specifier);
  }
  const require = createRequire(from);
  if (specifier.endsWith(".css")) return require.resolve(specifier);
  // A bare package name, such as "tailwindcss", names its stylesheet in
  // package.json's `style` field.
  const manifest = require.resolve(`${specifier}/package.json`);
  const { style } = JSON.parse(readFileSync(manifest, "utf8")) as {
    style: string;
  };
  return path.join(path.dirname(manifest), style);
}

/** A stylesheet and every stylesheet it imports, recursively. */
function stylesheetGraph(file: string, seen = new Set<string>()): string[] {
  if (seen.has(file)) return [];
  seen.add(file);
  const css = readFileSync(file, "utf8");
  return [
    css,
    ...[...css.matchAll(/@import\s+"([^"]+)"/g)].flatMap((match) =>
      stylesheetGraph(resolveStylesheet(match[1], file), seen),
    ),
  ];
}

/** Each @theme block, with any modifiers (default, inline, reference). */
function themeBlocks(css: string): { whole: string; body: string }[] {
  return [...css.matchAll(/@theme\b[^{;]*\{/g)].map((match) => {
    let depth = 1;
    let i = match.index + match[0].length;
    while (depth > 0 && i < css.length) {
      if (css[i] === "{") depth++;
      if (css[i] === "}") depth--;
      i++;
    }
    return {
      whole: css.slice(match.index, i),
      body: css.slice(match.index + match[0].length, i - 1),
    };
  });
}

function withoutThemeBlocks(css: string): string {
  return themeBlocks(css).reduce(
    // Blank the block but keep its line breaks, so line numbers still match.
    (text, block) => text.replace(block.whole, block.whole.replace(/.+/g, "")),
    css,
  );
}

/** Every custom property a stylesheet defines. */
function definedVariables(css: string): string[] {
  return [...css.matchAll(/(?<![\w-])(--[\w-]+)\s*:/g)].map(
    (match) => match[1],
  );
}

/**
 * Source text with its comments blanked out, line breaks kept. In TypeScript a
 * `//` right after a colon, quote, slash or word character is taken as part of
 * a URL or a string, so it stays.
 */
function withoutComments(text: string, isCss: boolean): string {
  const blank = (comment: string) => comment.replace(/[^\n]/g, " ");
  const noBlocks = text.replace(/\/\*[\s\S]*?\*\//g, blank);
  return isCss ? noBlocks : noBlocks.replace(/(?<![:"'`/\w])\/\/.*/g, blank);
}

/**
 * The line of each read of one of `names` without the tw prefix: `var(--x)`,
 * or Tailwind's `-(--x)` shorthand as in `bg-(--x)`, which compiles to
 * `var(--x)`. Either may span lines.
 */
function unprefixedReads(text: string, names: string[]): number[] {
  if (names.length === 0) return [];
  const read = new RegExp(
    `(?:var|-)\\(\\s*(?:${names.join("|")})\\s*[,)]`,
    "g",
  );
  return [...text.matchAll(read)].map(
    (match) => text.slice(0, match.index).split("\n").length,
  );
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === "__tests__" ? [] : sourceFiles(full);
    }
    return /\.(tsx?|css)$/.test(entry.name) ? [full] : [];
  });
}

// globals.css, Tailwind's own stylesheet (its default theme included) and
// ui-kit's.
const stylesheets = stylesheetGraph(globalsPath);
// Tailwind's prefix applies to every theme variable, whichever @theme block
// declares it.
const themeVariables = new Set(
  stylesheets.flatMap((css) =>
    themeBlocks(css).flatMap((block) => definedVariables(block.body)),
  ),
);
// A variable some stylesheet defines outside @theme, such as ui-kit's
// --font-sans on :root, is emitted as written, so it is safe to read
// unprefixed.
const definedUnprefixed = new Set(
  stylesheets.flatMap((css) => definedVariables(withoutThemeBlocks(css))),
);
const prefixOnly = [...themeVariables].filter(
  (name) => !definedUnprefixed.has(name),
);

// globals.css imports Tailwind with prefix(tw), which prefixes the theme's
// variables too: @theme's --color-primary-500 is emitted as
// --tw-color-primary-500, and the default theme's --spacing as --tw-spacing. A
// class such as shadow-[0_0_0_2px_var(--color-primary-500)] reads an undefined
// variable and draws nothing; the homepage cards' focus ring did exactly that.
describe("Tailwind theme variables", () => {
  test("globals.css imports Tailwind with the tw prefix", () => {
    expect(readFileSync(globalsPath, "utf8")).toContain(
      '@import "tailwindcss" prefix(tw);',
    );
    // From globals.css's @theme, and from Tailwind's default theme.
    expect(prefixOnly).toEqual(
      expect.arrayContaining([
        "--color-primary-500",
        "--spacing",
        "--color-red-500",
      ]),
    );
    expect(definedUnprefixed).toContain("--font-sans");
  });

  test("no source reads a prefixed-only theme variable without its tw prefix", () => {
    const offenders = sourceFiles(srcDir).flatMap((file) => {
      const isCss = file.endsWith(".css");
      const raw = readFileSync(file, "utf8");
      const text = withoutComments(
        file === globalsPath ? withoutThemeBlocks(raw) : raw,
        isCss,
      );
      return unprefixedReads(text, prefixOnly).map(
        (line) => `${path.relative(srcDir, file)}:${line}`,
      );
    });
    expect(offenders).toEqual([]);
  });

  // The scan itself: it must catch every way a read is written, and nothing
  // that isn't one.
  test("the scan flags any unprefixed read, and no prefixed read or comment", () => {
    const name = fc.constantFrom(...prefixOnly);
    const space = fc.constantFrom("", " ", "\n  ");
    const close = fc.constantFrom(")", ", #000)");
    const syntax = fc.constantFrom("var", "tw:bg-");
    fc.assert(
      fc.property(name, space, close, syntax, (v, s, end, prefix) => {
        const read = `${prefix}(${s}${v}${s}${end}`;
        const reads = [
          `const b = "${read}";`,
          `const c = "https://example.org/"; const d = "${read}";`,
        ].join("\n");
        // The second read starts on the line after the first one ends.
        const secondLine = 1 + read.split("\n").length;
        expect(
          unprefixedReads(withoutComments(reads, false), prefixOnly),
        ).toEqual([1, secondLine]);

        const prefixed = `--tw-${v.slice(2)}`;
        const harmless = [
          `const c = "${prefix}(${s}${prefixed}${s}${end}";`,
          `// ${read}`,
          `const d = 1; // ${read}`,
          `/* ${read} */`,
          `{/* ${read} */}`,
          `const e = "tw:grid-cols-[${v}(4)_1fr]";`,
          `const f = "https://example.org/"; const g = "${prefixed})";`,
        ].join("\n");
        expect(
          unprefixedReads(withoutComments(harmless, false), prefixOnly),
        ).toEqual([]);
        expect(
          unprefixedReads(withoutComments(`/* ${read} */`, true), prefixOnly),
        ).toEqual([]);
      }),
      { numRuns: 200 },
    );
  });
});
