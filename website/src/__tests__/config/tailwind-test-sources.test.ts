// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/postcss";
import postcss from "postcss";
import { expect, test } from "vitest";

const srcDir = fileURLToPath(new URL("../..", import.meta.url));
const websiteDir = path.dirname(srcDir);
const globalsPath = path.join(srcDir, "app/globals.css");

/** The selectors of each rule a compile of `css` emits. */
async function compiledSelectors(css: string, from: string) {
  const result = await postcss([
    tailwindcss({ base: websiteDir, optimize: false }),
  ]).process(css, { from });
  const selectors = new Set<string>();
  result.root.walkRules((rule) => {
    selectors.add(rule.selector);
  });
  return selectors;
}

// Tailwind scans every file under website/, tests included, so a class name
// written out in a test ships in the site's CSS. Tests build class names at
// run time instead, as in `${P}mt-4`.
test("the website's tests add no rules to its CSS", async () => {
  const css = readFileSync(globalsPath, "utf8");
  const withTests = await compiledSelectors(css, globalsPath);
  // Tailwind's PostCSS plugin caches by file, so this compile gets its own.
  const withoutTests = await compiledSelectors(
    `${css}\n@source not "../__tests__";\n`,
    path.join(srcDir, "app/globals-without-tests.css"),
  );
  expect(withTests.size).toBeGreaterThan(500);
  expect([...withTests].filter((s) => !withoutTests.has(s))).toEqual([]);
});
