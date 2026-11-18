// @vitest-environment node
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import tailwindcss from "@tailwindcss/postcss";
import postcss, { type AtRule, type Node, type Rule } from "postcss";
import { afterAll, describe, expect, test } from "vitest";

import {
  selectorClasses,
  UTILITY_PREFIX,
} from "../../../../scripts/check-built-css.mjs";

// Tailwind 4 reads a named size, such as the `sm` of `max-w-sm`, from the
// theme's --spacing-* keys before its own --container-* sizes. It does so for
// w-*, min-w-*, max-w-*, basis-* and the inline-size utilities. Both apps'
// themes name spacing keys xs to 5xl (4px to 64px), so in both apps
// `max-w-sm` is 8px wide, not Tailwind's 24rem. These tests fail on any class
// the source uses whose size a spacing key replaces that way. Tailwind scans
// this file too, so its class names are built at run time from the prefix.

const websiteDir = path.resolve(__dirname, "../../..");
const repoDir = path.resolve(websiteDir, "..");
const calculatorDir = path.join(repoDir, "calculator-app");
const P = UTILITY_PREFIX;

/**
 * Tailwind's value for a container size. Built at run time too: a variable
 * name written out here would add that variable to the website's CSS.
 */
const containerSize = (name: string) => `var(--tw-container-${name})`;

/** A declaration a compile puts in a class's rule. */
interface ClassDeclaration {
  /** The class, as the source writes it. */
  name: string;
  /** The property and its value, as in "max-width: 24rem". */
  declaration: string;
}

interface SpacingSizedClass {
  /** The class, as the source writes it. */
  name: string;
  /** The declaration Tailwind gives the class without the spacing key. */
  tailwindDeclaration: string;
}

/** The names of Tailwind's --container-* sizes: 3xs, 2xs, xs, sm and so on. */
function containerNames(appDir: string): string[] {
  const require = createRequire(path.join(appDir, "package.json"));
  const theme = readFileSync(require.resolve("tailwindcss/theme.css"), "utf8");
  return [...theme.matchAll(/--container-([\w-]+)\s*:/g)].map(
    (match) => match[1],
  );
}

/**
 * Each declaration a compile puts in a class's rule, keyed by the class, the
 * rules and at-rules around the declaration, and the declaration itself.
 */
async function classDeclarations(appDir: string, css: string, from: string) {
  const result = await postcss([
    tailwindcss({ base: appDir, optimize: false }),
  ]).process(css, { from });
  const declarations = new Map<string, ClassDeclaration>();
  result.root.walkDecls((decl) => {
    const context: string[] = [];
    let names: string[] = [];
    for (
      let node: Node | undefined = decl.parent;
      node && node.type !== "root";
      node = node.parent
    ) {
      if (node.type === "rule") {
        // The outermost rule names the class; rules nested in it, such as
        // `&:hover`, only narrow it.
        names = selectorClasses((node as Rule).selector);
        context.unshift((node as Rule).selector);
      } else {
        context.unshift(`@${(node as AtRule).name} ${(node as AtRule).params}`);
      }
    }
    const declaration = `${decl.prop}: ${decl.value}`;
    for (const name of names) {
      declarations.set(`${name} | ${context.join(" > ")} { ${declaration} }`, {
        name,
        declaration,
      });
    }
  });
  return declarations;
}

/**
 * The classes an app's source uses whose size comes from a spacing key named
 * like one of Tailwind's container sizes. The stylesheet compiles twice: as it
 * is, and with those spacing keys unset. A class whose declarations differ
 * between the two would take Tailwind's size but for the spacing key. A
 * spacing utility with no other meaning, such as `gap-sm`, compiles only with
 * the keys, so it isn't reported.
 */
async function spacingSizedClasses(
  appDir: string,
  stylesheet: string,
): Promise<SpacingSizedClass[]> {
  const from = path.resolve(appDir, stylesheet);
  const css = readFileSync(from, "utf8");
  const withTheme = await classDeclarations(appDir, css, from);
  if (![...withTheme.values()].some(({ name }) => name.startsWith(P))) {
    // Otherwise a compile that scanned nothing would pass.
    throw new Error(`A compile of ${stylesheet} has no ${P} utilities`);
  }
  const unset = containerNames(appDir)
    .map((name) => `  --spacing-${name}: initial;`)
    .join("\n");
  // Tailwind's PostCSS plugin caches by file, so this compile gets its own.
  const withoutSpacingSizes = await classDeclarations(
    appDir,
    `${css}\n@theme {\n${unset}\n}\n`,
    path.join(
      path.dirname(from),
      `${path.parse(from).name}-without-spacing-sizes.css`,
    ),
  );
  const found = new Map<string, SpacingSizedClass>();
  for (const [key, { name, declaration }] of withoutSpacingSizes) {
    if (!withTheme.has(key)) {
      found.set(`${name} ${declaration}`, {
        name,
        tailwindDeclaration: declaration,
      });
    }
  }
  return [...found.values()].sort((a, b) =>
    a.name === b.name
      ? a.tailwindDeclaration.localeCompare(b.tailwindDeclaration)
      : a.name.localeCompare(b.name),
  );
}

const FIX =
  "Tailwind would size these classes from its container sizes, but the theme's spacing keys of the same name size them instead (max-w-sm is 8px, not 24rem). Write the size out, such as max-w-[24rem].";

const scratch: string[] = [];
afterAll(() => {
  for (const dir of scratch) rmSync(dir, { recursive: true, force: true });
});

/**
 * An app whose stylesheet and source are these. Under node_modules/.cache, so
 * it resolves postcss and Tailwind the way the real apps do.
 */
function fixtureApp(css: string, source: string): string {
  const parent = path.join(websiteDir, "node_modules/.cache");
  mkdirSync(parent, { recursive: true });
  const app = mkdtempSync(path.join(parent, "tailwind-size-classes-"));
  scratch.push(app);
  writeFileSync(path.join(app, "package.json"), '{ "private": true }');
  writeFileSync(path.join(app, "globals.css"), css);
  mkdirSync(path.join(app, "src"));
  writeFileSync(path.join(app, "src/page.tsx"), source);
  return app;
}

describe("spacingSizedClasses", () => {
  test("given size classes named like spacing keys then it reports each with Tailwind's size", async () => {
    // Given: spacing keys named like container sizes (sm, 2xl) and one that
    // isn't (sidebar); size classes that clash, and classes that don't
    const clashing = [
      `${P}sm:max-w-sm`,
      `${P}w-2xl`,
      `${P}hover:min-w-sm`,
      `${P}basis-sm`,
      `${P}max-inline-sm`,
    ];
    const fine = [
      `${P}gap-sm`,
      `${P}size-sm`,
      `${P}h-2xl`,
      `${P}max-w-[24rem]`,
      `${P}max-w-md`,
      `${P}w-sidebar`,
      `${P}text-sm`,
    ];
    const app = fixtureApp(
      `@import "tailwindcss" prefix(tw);\n@theme {\n  --spacing-sm: 8px;\n  --spacing-2xl: 24px;\n  --spacing-sidebar: 79px;\n}\n`,
      `export const page = <div className="${[...clashing, ...fine].join(" ")}" />;\n`,
    );

    // When
    const found = await spacingSizedClasses(app, "globals.css");

    // Then
    expect(found).toEqual([
      {
        name: `${P}basis-sm`,
        tailwindDeclaration: `flex-basis: ${containerSize("sm")}`,
      },
      {
        name: `${P}hover:min-w-sm`,
        tailwindDeclaration: `min-width: ${containerSize("sm")}`,
      },
      {
        name: `${P}max-inline-sm`,
        tailwindDeclaration: `max-inline-size: ${containerSize("sm")}`,
      },
      {
        name: `${P}sm:max-w-sm`,
        tailwindDeclaration: `max-width: ${containerSize("sm")}`,
      },
      {
        name: `${P}w-2xl`,
        tailwindDeclaration: `width: ${containerSize("2xl")}`,
      },
    ]);
  });

  test("given a stylesheet whose compile has no utilities then it throws", async () => {
    // Given: an app whose source uses none, so it would pass whatever it held
    const app = fixtureApp(
      `@import "tailwindcss" prefix(tw);\n`,
      "export const page = null;\n",
    );

    // When / Then
    await expect(spacingSizedClasses(app, "globals.css")).rejects.toThrow(
      /no tw: utilities/,
    );
  });

  test("given the website's source then no class takes its size from a spacing key", async () => {
    expect(
      await spacingSizedClasses(websiteDir, "src/app/globals.css"),
      FIX,
    ).toEqual([]);
  }, 60_000);

  test("given the calculator's source, app/src included, then no class takes its size from a spacing key", async () => {
    expect(
      await spacingSizedClasses(calculatorDir, "src/app/globals.css"),
      FIX,
    ).toEqual([]);
  }, 60_000);
});
