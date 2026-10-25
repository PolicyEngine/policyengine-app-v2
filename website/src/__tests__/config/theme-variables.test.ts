// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const srcDir = fileURLToPath(new URL("../..", import.meta.url));
const globalsPath = path.join(srcDir, "app/globals.css");
const globalsCss = readFileSync(globalsPath, "utf8");

/** The bodies of globals.css's @theme blocks. */
function themeBlocks(css: string): string[] {
  const blocks: string[] = [];
  for (const match of css.matchAll(/@theme\s*\{/g)) {
    let depth = 1;
    let i = match.index + match[0].length;
    const start = i;
    while (depth > 0 && i < css.length) {
      if (css[i] === "{") depth++;
      if (css[i] === "}") depth--;
      i++;
    }
    blocks.push(css.slice(start, i - 1));
  }
  return blocks;
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

/** Every custom property a stylesheet defines. */
function definedVariables(css: string): string[] {
  return [...css.matchAll(/(?<![\w-])(--[\w-]+)\s*:/g)].map(
    (match) => match[1],
  );
}

const globalsOutsideTheme = themeBlocks(globalsCss).reduce(
  (css, block) => css.replace(block, ""),
  globalsCss,
);
const themeVariables = themeBlocks(globalsCss).flatMap(definedVariables);

// The stylesheets globals.css imports besides Tailwind (ui-kit's), whose
// variables are emitted as written.
const require = createRequire(import.meta.url);
const importedSheets = [...globalsCss.matchAll(/@import "([^"]+)"/g)]
  .map((match) => match[1])
  .filter((specifier) => specifier !== "tailwindcss")
  .map((specifier) =>
    readFileSync(
      specifier.startsWith(".")
        ? path.resolve(path.dirname(globalsPath), specifier)
        : require.resolve(specifier),
      "utf8",
    ),
  );

// A theme variable some stylesheet also defines without the prefix, such as
// ui-kit's --font-sans, is safe to read unprefixed.
const definedUnprefixed = new Set(
  [globalsOutsideTheme, ...importedSheets].flatMap(definedVariables),
);
const prefixOnly = themeVariables.filter(
  (name) => !definedUnprefixed.has(name),
);

// globals.css imports Tailwind with prefix(tw), which prefixes the theme's
// variables too: @theme's --color-primary-500 is emitted as
// --tw-color-primary-500. A class such as
// shadow-[0_0_0_2px_var(--color-primary-500)] reads an undefined variable and
// draws nothing; the homepage cards' focus ring did exactly that.
describe("Tailwind theme variables", () => {
  test("globals.css imports Tailwind with the tw prefix", () => {
    expect(globalsCss).toContain('@import "tailwindcss" prefix(tw);');
    expect(prefixOnly).toContain("--color-primary-500");
    expect(definedUnprefixed).toContain("--font-sans");
  });

  test("no source reads a prefixed-only theme variable without its tw prefix", () => {
    const unprefixedRead = new RegExp(
      `var\\(\\s*(${prefixOnly.join("|")})\\s*[,)]`,
    );
    const offenders = sourceFiles(srcDir).flatMap((file) => {
      const text =
        file === globalsPath ? globalsOutsideTheme : readFileSync(file, "utf8");
      return text
        .split("\n")
        .flatMap((line, i) =>
          unprefixedRead.test(line)
            ? [`${path.relative(srcDir, file)}:${i + 1}`]
            : [],
        );
    });
    expect(offenders).toEqual([]);
  });
});
