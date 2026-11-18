import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

const CHECK_SCRIPT = join(__dirname, "..", ".github", "check_pr_fragment.sh");
const PACKAGE_PATH = "packages/api-client";

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

function runCheck() {
  return spawnSync("bash", [CHECK_SCRIPT], {
    cwd: repository,
    encoding: "utf8",
  });
}

/** Commits what the test wrote, then checks that commit against its parent. */
function runCheckOnChanges() {
  git("add", "--all");
  git("commit", "--allow-empty", "--quiet", "--message", "The PR's change");
  return runCheck();
}

beforeEach(() => {
  repository = mkdtempSync(join(tmpdir(), "api-client-fragment-"));
  git("init", "--quiet", "--initial-branch=main");
  git("config", "user.name", "Fragment Check Test");
  git("config", "user.email", "fragment-check@example.com");
  writeRepositoryFile(`${PACKAGE_PATH}/package.json`, "{}\n");
  writeRepositoryFile(`${PACKAGE_PATH}/src/client.ts`, "export {};\n");
  writeRepositoryFile(`${PACKAGE_PATH}/changelog.d/.gitkeep`, "");
  writeRepositoryFile("app/src/page.tsx", "export {};\n");
  git("add", "--all");
  git("commit", "--quiet", "--message", "Main before the PR");
});

afterEach(() => {
  rmSync(repository, { recursive: true, force: true });
});

describe("the changelog fragment check", () => {
  test.each([
    "src/client.ts",
    "tests/client.test.ts",
    "README.md",
    "LICENSE",
    "package.json",
    "tsconfig.json",
    "vitest.config.ts",
    "prettier.config.mjs",
    "CHANGELOG.md",
    ".github/bump_version.py",
  ])(
    "given a change to %s in the package and no fragment then it fails",
    (changedFile) => {
      // Given
      writeRepositoryFile(`${PACKAGE_PATH}/${changedFile}`, "// changed\n");

      // When
      const result = runCheckOnChanges();

      // Then
      expect(result.status).toBe(1);
      expect(result.stdout).toContain("changelog.d");
    },
  );

  test("given a deleted package file and no fragment then it fails", () => {
    // Given
    git("rm", "--quiet", `${PACKAGE_PATH}/src/client.ts`);

    // When
    const result = runCheckOnChanges();

    // Then
    expect(result.status).toBe(1);
  });

  test.each(["breaking", "added", "removed", "changed", "fixed"])(
    "given a package change and a %s fragment then it passes",
    (fragmentType) => {
      // Given
      writeRepositoryFile(`${PACKAGE_PATH}/tests/client.test.ts`, "// new\n");
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

  test("given a change only outside the package then it passes", () => {
    // Given
    writeRepositoryFile("app/src/page.tsx", "// changed\n");

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

  test("given a fragment with an unknown type then it fails and names the file", () => {
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

  test("given a fragment in a subdirectory then it fails and names the file", () => {
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
    const result = runCheck();

    // Then
    expect(result.status).toBe(1);
  });
});
