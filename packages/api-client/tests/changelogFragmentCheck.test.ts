import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

const CHECK_SCRIPT = join(
  __dirname,
  "..",
  "scripts",
  "check-changelog-fragment.mjs",
);
const PACKAGE_PATH = "packages/api-client";
const BASE_MANIFEST = {
  name: "@policyengine/api-client",
  version: "0.1.1",
  files: ["dist", "README.md"],
  scripts: { test: "vitest run" },
  devDependencies: { vitest: "^3.2.3" },
};

let repository: string;

function git(...gitArguments: string[]): string {
  return execFileSync("git", gitArguments, {
    cwd: repository,
    encoding: "utf8",
  }).trim();
}

function writeRepositoryFile(relativePath: string, contents: string): void {
  const absolutePath = join(repository, relativePath);
  mkdirSync(dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, contents);
}

function writeManifest(manifest: Record<string, unknown>): void {
  writeRepositoryFile(
    `${PACKAGE_PATH}/package.json`,
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
}

/** Commits what the test wrote, then runs the check from main to that commit. */
function runCheckOnChanges() {
  git("add", "--all");
  git("commit", "--allow-empty", "--quiet", "--message", "The PR's change");
  return spawnSync(process.execPath, [CHECK_SCRIPT, "HEAD^1", "HEAD"], {
    cwd: repository,
    encoding: "utf8",
  });
}

beforeEach(() => {
  repository = mkdtempSync(join(tmpdir(), "api-client-fragment-"));
  git("init", "--quiet", "--initial-branch=main");
  git("config", "user.name", "Fragment Check Test");
  git("config", "user.email", "fragment-check@example.com");
  writeManifest(BASE_MANIFEST);
  writeRepositoryFile(`${PACKAGE_PATH}/src/client.ts`, "export {};\n");
  writeRepositoryFile(`${PACKAGE_PATH}/README.md`, "# Client\n");
  writeRepositoryFile(`${PACKAGE_PATH}/changelog.d/.gitkeep`, "");
  git("add", "--all");
  git("commit", "--quiet", "--message", "Main before the PR");
});

afterEach(() => {
  rmSync(repository, { recursive: true, force: true });
});

describe("the changelog fragment check", () => {
  test.each([
    `${PACKAGE_PATH}/src/client.ts`,
    `${PACKAGE_PATH}/src/new-file.ts`,
    `${PACKAGE_PATH}/README.md`,
    `${PACKAGE_PATH}/LICENSE`,
    `${PACKAGE_PATH}/tsconfig.json`,
    `${PACKAGE_PATH}/tsconfig.build.json`,
  ])("given a change to %s and no fragment then it fails", (changedPath) => {
    // Given
    writeRepositoryFile(changedPath, "// changed\n");

    // When
    const result = runCheckOnChanges();

    // Then
    expect(result.status).toBe(1);
    expect(result.stdout).toContain("changelog.d");
  });

  test("given a deleted source file and no fragment then it fails", () => {
    // Given
    git("rm", "--quiet", `${PACKAGE_PATH}/src/client.ts`);

    // When
    const result = runCheckOnChanges();

    // Then
    expect(result.status).toBe(1);
  });

  test.each(["breaking", "added", "removed", "changed", "fixed"])(
    "given a source change and a %s fragment then it passes",
    (fragmentType) => {
      // Given
      writeRepositoryFile(`${PACKAGE_PATH}/src/client.ts`, "// changed\n");
      writeRepositoryFile(
        `${PACKAGE_PATH}/changelog.d/some-change.${fragmentType}.md`,
        "A change.\n",
      );

      // When
      const result = runCheckOnChanges();

      // Then
      expect(result.status, result.stdout).toBe(0);
    },
  );

  test.each([
    `${PACKAGE_PATH}/tests/client.test.ts`,
    `${PACKAGE_PATH}/vitest.config.ts`,
    `${PACKAGE_PATH}/prettier.config.mjs`,
    `${PACKAGE_PATH}/.prettierignore`,
    `${PACKAGE_PATH}/scripts/some-script.mjs`,
    `${PACKAGE_PATH}/CHANGELOG.md`,
    "app/src/page.tsx",
  ])("given a change only to %s then it passes", (changedPath) => {
    // Given
    writeRepositoryFile(changedPath, "// changed\n");

    // When
    const result = runCheckOnChanges();

    // Then
    expect(result.status, result.stdout).toBe(0);
  });

  test("given no changes at all then it passes", () => {
    // When
    const result = runCheckOnChanges();

    // Then
    expect(result.status, result.stdout).toBe(0);
  });

  test("given package.json changes only devDependencies and scripts then it passes", () => {
    // Given
    writeManifest({
      ...BASE_MANIFEST,
      scripts: { test: "vitest run --coverage" },
      devDependencies: { vitest: "^3.3.0" },
    });

    // When
    const result = runCheckOnChanges();

    // Then
    expect(result.status, result.stdout).toBe(0);
  });

  test("given package.json changes a shipped field and no fragment then it fails", () => {
    // Given
    writeManifest({ ...BASE_MANIFEST, files: ["dist"] });

    // When
    const result = runCheckOnChanges();

    // Then
    expect(result.status).toBe(1);
  });

  test("given a fragment with an unknown type then it fails and names the file, even without a package change", () => {
    // Given
    writeRepositoryFile(
      `${PACKAGE_PATH}/changelog.d/some-change.improved.md`,
      "A change.\n",
    );

    // When
    const result = runCheckOnChanges();

    // Then
    expect(result.status).toBe(1);
    expect(result.stdout).toContain("some-change.improved.md");
  });

  test("given an empty fragment then it fails and names the file", () => {
    // Given
    writeRepositoryFile(`${PACKAGE_PATH}/src/client.ts`, "// changed\n");
    writeRepositoryFile(
      `${PACKAGE_PATH}/changelog.d/some-change.fixed.md`,
      "  \n",
    );

    // When
    const result = runCheckOnChanges();

    // Then
    expect(result.status).toBe(1);
    expect(result.stdout).toContain("some-change.fixed.md");
  });

  test("given a fragment in a subdirectory then it does not count", () => {
    // Given
    writeRepositoryFile(`${PACKAGE_PATH}/src/client.ts`, "// changed\n");
    writeRepositoryFile(
      `${PACKAGE_PATH}/changelog.d/nested/some-change.fixed.md`,
      "A change.\n",
    );

    // When
    const result = runCheckOnChanges();

    // Then
    expect(result.status).toBe(1);
    expect(result.stdout).toContain("nested/some-change.fixed.md");
  });

  test("given a fragment that was not committed then it does not count", () => {
    // Given
    writeRepositoryFile(`${PACKAGE_PATH}/src/client.ts`, "// changed\n");
    git("add", "--all");
    git("commit", "--quiet", "--message", "The PR's change");
    writeRepositoryFile(
      `${PACKAGE_PATH}/changelog.d/some-change.fixed.md`,
      "A change.\n",
    );

    // When
    const result = spawnSync(
      process.execPath,
      [CHECK_SCRIPT, "HEAD^1", "HEAD"],
      { cwd: repository, encoding: "utf8" },
    );

    // Then
    expect(result.status).toBe(1);
  });
});
