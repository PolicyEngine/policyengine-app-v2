import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";

const BUMP_VERSION_SCRIPT = join(__dirname, "..", ".github", "bump_version.py");

const temporaryPackages: string[] = [];

/** A directory laid out like this package, with the given fragment files. */
function createPackage(
  version: string,
  fragmentFileNames: readonly string[],
): string {
  const packageDirectory = mkdtempSync(join(tmpdir(), "api-client-version-"));
  temporaryPackages.push(packageDirectory);
  const fragmentDirectory = join(packageDirectory, "changelog.d");
  mkdirSync(fragmentDirectory);
  writeFileSync(join(fragmentDirectory, ".gitkeep"), "");
  for (const fragmentFileName of fragmentFileNames) {
    writeFileSync(join(fragmentDirectory, fragmentFileName), "A change.\n");
  }
  writeFileSync(
    join(packageDirectory, "package.json"),
    `${JSON.stringify({ name: "@policyengine/api-client", version, files: ["dist"] }, null, 2)}\n`,
  );
  return packageDirectory;
}

function bumpVersion(packageDirectory: string) {
  return spawnSync("python3", [BUMP_VERSION_SCRIPT], {
    cwd: packageDirectory,
    encoding: "utf8",
  });
}

function manifestText(packageDirectory: string): string {
  return readFileSync(join(packageDirectory, "package.json"), "utf8");
}

afterEach(() => {
  for (const packageDirectory of temporaryPackages.splice(0)) {
    rmSync(packageDirectory, { recursive: true, force: true });
  }
});

describe("raising the package version from changelog fragments", () => {
  test.each([
    ["fixed", "0.1.1", "0.1.2"],
    ["changed", "0.1.1", "0.1.2"],
    ["added", "0.1.1", "0.2.0"],
    ["removed", "0.1.1", "0.2.0"],
    ["breaking", "0.1.1", "1.0.0"],
    ["fixed", "1.2.3", "1.2.4"],
    ["added", "1.2.3", "1.3.0"],
    ["removed", "1.2.3", "1.3.0"],
    ["breaking", "1.2.3", "2.0.0"],
  ])(
    "given a %s fragment on version %s then the version becomes %s",
    (fragmentType, currentVersion, expectedVersion) => {
      // Given
      const packageDirectory = createPackage(currentVersion, [
        `some-change.${fragmentType}.md`,
      ]);

      // When
      const result = bumpVersion(packageDirectory);

      // Then
      expect(result.status, result.stderr).toBe(0);
      expect(JSON.parse(manifestText(packageDirectory)).version).toBe(
        expectedVersion,
      );
    },
  );

  test("given fragments of several types then the largest raise applies once", () => {
    // Given
    const packageDirectory = createPackage("1.2.3", [
      "first.fixed.md",
      "second.added.md",
      "third.changed.md",
    ]);

    // When
    bumpVersion(packageDirectory);

    // Then
    expect(JSON.parse(manifestText(packageDirectory)).version).toBe("1.3.0");
  });

  test("given a raise then only the manifest's version changes", () => {
    // Given
    const packageDirectory = createPackage("0.1.1", ["some-change.fixed.md"]);
    const manifestBefore = manifestText(packageDirectory);

    // When
    bumpVersion(packageDirectory);

    // Then
    expect(manifestText(packageDirectory)).toBe(
      manifestBefore.replace('"version": "0.1.1"', '"version": "0.1.2"'),
    );
  });

  test("given no fragments then the version stays as it is", () => {
    // Given
    const packageDirectory = createPackage("0.1.1", []);
    const manifestBefore = manifestText(packageDirectory);

    // When
    const result = bumpVersion(packageDirectory);

    // Then
    expect(result.status, result.stderr).toBe(0);
    expect(manifestText(packageDirectory)).toBe(manifestBefore);
  });
});
