import { execFileSync } from "node:child_process";
import { lstatSync, readFileSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { describe, expect, test } from "vitest";

// PolicyEngine is leaving Open Collective, so a link to its collective or to
// PSL's would send donors to the wrong place.
const COLLECTIVE_LINK = /opencollective\.com\/(policyengine|psl)\b/i;

const REPO_ROOT = join(__dirname, "../../../..");
const TEXT_EXTENSIONS = new Set([
  ".html",
  ".ipynb",
  ".js",
  ".json",
  ".md",
  ".mdx",
  ".mjs",
  ".ts",
  ".tsx",
  ".txt",
  ".xml",
  ".yaml",
  ".yml",
]);

// The legacy Vite copy of the donate page is not served in production, and
// the guard-app-dir CI job blocks edits to it, so it keeps its old link until
// the legacy website pages are deleted. This file holds sample links.
const ALLOWED_FILES = new Set([
  "app/src/pages/Donate.page.tsx",
  "app/src/tests/fixtures/pages/DonateMocks.ts",
  "app/src/tests/unit/pages/Donate.test.tsx",
  relative(REPO_ROOT, __filename),
]);

// Tracked files only, so build output, ignored files and nested worktrees in a
// local checkout don't count. Symlinks are skipped; their targets are tracked.
function trackedTextFiles(): string[] {
  return execFileSync("git", ["ls-files", "-z"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  })
    .split("\0")
    .filter(
      (path) =>
        TEXT_EXTENSIONS.has(extname(path)) &&
        lstatSync(join(REPO_ROOT, path), { throwIfNoEntry: false })?.isFile(),
    );
}

describe("Open Collective links", () => {
  test("nothing outside the legacy donate page links to PolicyEngine's or PSL's collective", () => {
    const files = trackedTextFiles();
    expect(files).toContain("website/src/app/[countryId]/donate/page.tsx");
    expect(files).toContain(
      "app/src/data/posts/articles/us-giving-tuesday-2025.md",
    );

    const offenders = files.filter(
      (path) =>
        !ALLOWED_FILES.has(path) &&
        COLLECTIVE_LINK.test(readFileSync(join(REPO_ROOT, path), "utf8")),
    );
    expect(offenders).toEqual([]);
  });

  test("the pattern catches the links this repo used to carry", () => {
    expect(
      COLLECTIVE_LINK.test("https://opencollective.com/policyengine"),
    ).toBe(true);
    expect(COLLECTIVE_LINK.test("(https://opencollective.com/psl)")).toBe(true);
    expect(COLLECTIVE_LINK.test("https://opencollective.com/pslmodels")).toBe(
      false,
    );
    expect(COLLECTIVE_LINK.test("https://opencollective.com/webpack")).toBe(
      false,
    );
  });
});
