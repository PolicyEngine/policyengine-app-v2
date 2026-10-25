// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fc from "fast-check";
import ts from "typescript";
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

/** Every comment in a .ts or .tsx file, as TypeScript reads it. */
function commentRanges(text: string, file: string): ts.CommentRange[] {
  const kind = file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const source = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    kind,
  );
  const ranges = new Map<number, ts.CommentRange>();
  // Each comment is in the trivia before exactly one token. TypeScript calls
  // the comments before the trivia's first line break trailing, and the rest
  // leading.
  const visit = (node: ts.Node): void => {
    // A JSDoc node's text is a comment in the next token's trivia.
    if (ts.isJSDoc(node)) return;
    // The end-of-file token lists a file-final JSDoc as its child, but its own
    // trivia holds every comment after the last statement.
    const children =
      node.kind === ts.SyntaxKind.EndOfFileToken
        ? []
        : node.getChildren(source);
    if (children.length > 0) {
      children.forEach(visit);
      return;
    }
    // JSX text has no trivia, though a `//` in it would scan as a comment.
    if (node.kind === ts.SyntaxKind.JsxText) return;
    for (const range of [
      ...(ts.getTrailingCommentRanges(text, node.pos) ?? []),
      ...(ts.getLeadingCommentRanges(text, node.pos) ?? []),
    ]) {
      ranges.set(range.pos, range);
    }
  };
  visit(source);
  return [...ranges.values()];
}

/**
 * Source text with its comments blanked out, line breaks kept. TypeScript
 * finds a .ts or .tsx file's comments, so a `//` or `/*` in a string, a
 * template literal, a regular expression or JSX text stays. In CSS, a comment
 * is a `/* … *\/` outside a string.
 */
function withoutComments(text: string, file: string): string {
  const blank = (comment: string) => comment.replace(/[^\n]/g, " ");
  if (file.endsWith(".css")) {
    return text.replace(
      /"(?:\\[\s\S]|[^"\\\n])*"|'(?:\\[\s\S]|[^'\\\n])*'|\/\*[\s\S]*?(?:\*\/|$)/g,
      (match) => (match.startsWith("/*") ? blank(match) : match),
    );
  }
  return commentRanges(text, file).reduce(
    (out, { pos, end }) =>
      out.slice(0, pos) + blank(out.slice(pos, end)) + out.slice(end),
    text,
  );
}

/**
 * Finds each read of one of `names` without the tw prefix, and returns its
 * line: `var(--x)`, or Tailwind's shorthand, as in `bg-(--x)` or
 * `bg-(color:--x)` with a type hint, which compiles to `var(--x)`. Any of them
 * may span lines.
 */
function unprefixedReader(names: string[]): (text: string) => number[] {
  if (names.length === 0) return () => [];
  const read = new RegExp(
    `(?:var\\(|-\\((?:[\\w-]+:)?)\\s*(?:${names.join("|")})\\s*[,)]`,
    "g",
  );
  return (text) =>
    [...text.matchAll(read)].map(
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
const unprefixedReads = unprefixedReader(prefixOnly);

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
    // globals.css is scanned whole: Tailwind doesn't prefix a read inside an
    // @theme value, so `--color-ring: var(--color-primary-500)` there reads
    // an undefined variable too. Its definitions are never reads.
    const offenders = sourceFiles(srcDir).flatMap((file) => {
      const text = withoutComments(readFileSync(file, "utf8"), file);
      return unprefixedReads(text).map(
        (line) => `${path.relative(srcDir, file)}:${line}`,
      );
    });
    expect(offenders).toEqual([]);
  });

  // The scan itself, in two parts: it flags every prefix-only name in every
  // way a read is written, and it reads comments the way TypeScript and CSS
  // do.
  // Class names are built at run time: Tailwind scans this file too, and a
  // class written out here would ship in the site's CSS.
  const P = "tw:";
  const readShapes = (name: string) =>
    ["var(", `${P}bg-(`, `${P}bg-(color:`, `${P}text-(length:`].flatMap(
      (open) =>
        ["", " ", "\n  "].flatMap((space) =>
          [")", ", #000)"].map(
            (close) => `${open}${space}${name}${space}${close}`,
          ),
        ),
    );
  const prefixed = (name: string) => `--tw-${name.slice(2)}`;

  test("the scan flags every prefix-only name in every read shape, and no prefixed one", () => {
    const missed = prefixOnly.flatMap((name) =>
      readShapes(name).filter((read) => unprefixedReads(read).length !== 1),
    );
    const flagged = prefixOnly.flatMap((name) =>
      readShapes(prefixed(name)).filter(
        (read) => unprefixedReads(read).length !== 0,
      ),
    );
    expect(prefixOnly.length).toBeGreaterThan(400);
    expect({ missed, flagged }).toEqual({ missed: [], flagged: [] });
  });

  // Source around a read, `R`. In code, the read must be flagged on the line
  // it starts on; in a comment, never.
  const inCode: [string, string][] = [
    ["x.tsx", "const b = `R`;"],
    ["x.tsx", 'const c = "https://example.org/"; const d = `R`;'],
    ["x.tsx", `const u = \`${P}bg-[url(//policyengine.org/a.png)] R\`;`],
    [
      "x.tsx",
      "// Tool zones live under /us/*.\nconst x = `R`;\n/** Docs. */\nconst y = 1;",
    ],
    ["x.tsx", "const t = `// R`;"],
    ["x.tsx", "const r = /[/*]/;\nconst s = `R`;\n/** Docs. */"],
    // A JSDoc tag's text is no comment of its own.
    ["x.tsx", "/** @param a {@link b} // c */ const s = `R`;"],
    ["x.tsx", "const el = <p>// see</p>; const s = `R`;"],
    ["x.tsx", "const el = <p>/* see</p>; const s = `R`; /* x */"],
    ["x.tsx", 'const el = <a href="//example.org" className="R" />;'],
    ["x.ts", "const t = `${x} R`; // x"],
    ["x.css", ".a {\n  color: R;\n}"],
    ["x.css", "@theme {\n  --color-ring: R;\n}"],
    ["x.css", '.b { content: "/*"; color: R; } /* x */'],
    ["x.css", "a {\n  background: url(//example.org/a.png), R;\n}"],
  ];
  const inComments: [string, string][] = [
    ["x.tsx", "// R"],
    ["x.tsx", "const d = 1; // R"],
    ["x.tsx", "/* R */"],
    ["x.tsx", "/** R */\nconst f = 1;"],
    ["x.tsx", "const el = <div>{/* R */}</div>;"],
    ["x.tsx", "const t = `${x /* R */}`;"],
    ["x.tsx", "// under /us/* R"],
    ["x.tsx", "const d = 1;\n// R\n/** Docs. */"],
    ["x.ts", "const d = 1;\n/* R */ /** Docs. */\n"],
    ["x.css", "/* R */"],
    ["x.css", ".a { color: red; } /* R */"],
  ];

  test("the scan flags reads in code, and none in comments", () => {
    const name = fc.constantFrom(...prefixOnly);
    const shape = fc.integer({ min: 0, max: readShapes("--x").length - 1 });
    const blanked = (text: string, file: string) => {
      const out = withoutComments(text, file);
      // Blanking keeps every line break, so line numbers still match.
      expect(out.replace(/[^\n]/g, "")).toBe(text.replace(/[^\n]/g, ""));
      expect(out).toHaveLength(text.length);
      return out;
    };
    fc.assert(
      fc.property(name, shape, (v, i) => {
        const read = readShapes(v)[i];
        for (const [file, around] of inCode) {
          const text = around.replace("R", read);
          const line = text.slice(0, text.indexOf(read)).split("\n").length;
          expect(unprefixedReads(blanked(text, file))).toEqual([line]);
          const safe = around.replace("R", readShapes(prefixed(v))[i]);
          expect(unprefixedReads(blanked(safe, file))).toEqual([]);
        }
        for (const [file, around] of inComments) {
          // A read spanning lines leaves a line comment, but nothing before
          // its name is left to read.
          const text = around.replace("R", read);
          expect(unprefixedReads(blanked(text, file))).toEqual([]);
        }
        // Tailwind's --spacing() function reads the prefixed variable.
        expect(
          unprefixedReads(`const e = "${P}grid-cols-[${v}(4)_1fr]";`),
        ).toEqual([]);
      }),
      { numRuns: 300 },
    );
  });
});
