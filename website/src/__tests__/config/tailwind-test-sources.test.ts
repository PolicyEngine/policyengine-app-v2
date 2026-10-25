// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/postcss";
import postcss, { type AtRule, type Node, type Rule } from "postcss";
import { expect, test } from "vitest";

const srcDir = fileURLToPath(new URL("../..", import.meta.url));
const websiteDir = path.dirname(srcDir);
const globalsPath = path.join(srcDir, "app/globals.css");

/**
 * Each declaration a compile of `css` emits, with the rules and at-rules
 * around it: "@layer theme > :root, :host { <variable>: <value> }". A test that
 * names only a theme variable adds a declaration there and no rule.
 */
async function compiledDeclarations(css: string, from: string) {
  const result = await postcss([
    tailwindcss({ base: websiteDir, optimize: false }),
  ]).process(css, { from });
  const declarations = new Set<string>();
  result.root.walkDecls((decl) => {
    const context: string[] = [];
    for (
      let node: Node | undefined = decl.parent;
      node && node.type !== "root";
      node = node.parent
    ) {
      context.unshift(
        node.type === "rule"
          ? (node as Rule).selector
          : `@${(node as AtRule).name} ${(node as AtRule).params}`,
      );
    }
    declarations.add(`${context.join(" > ")} { ${decl.prop}: ${decl.value} }`);
  });
  return declarations;
}

// Tailwind scans every file under website/, tests included, so a class name
// written out in a test ships in the site's CSS. Tests build class names at
// run time instead, as in `${P}mt-4`.
test("the website's tests add nothing to its CSS", async () => {
  const css = readFileSync(globalsPath, "utf8");
  const withTests = await compiledDeclarations(css, globalsPath);
  // Tailwind's PostCSS plugin caches by file, so this compile gets its own.
  const withoutTests = await compiledDeclarations(
    `${css}\n@source not "../__tests__";\n`,
    path.join(srcDir, "app/globals-without-tests.css"),
  );
  expect(withTests.size).toBeGreaterThan(1000);
  expect([...withTests].filter((s) => !withoutTests.has(s))).toEqual([]);
});
