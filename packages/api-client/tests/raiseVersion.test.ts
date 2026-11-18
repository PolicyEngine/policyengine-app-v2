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

const RAISE_VERSION_SCRIPT = join(
  __dirname,
  "..",
  "scripts",
  "raise-version.mjs",
);
const PACKAGE_PATH = join("packages", "api-client");

const temporaryRepositories: string[] = [];

/** A lockfile with this package's workspace entry and one that must not change. */
function lockfileFor(version: string): string {
  return `{
  "workspaces": {
    "packages/api-client": {
      "name": "@policyengine/api-client",
      "version": "${version}",
      "devDependencies": {
        "vitest": "^3.2.3",
      },
    },
    "packages/other": {
      "name": "@policyengine/other",
      "version": "${version}",
    },
  },
}
`;
}

/** A directory laid out like the repository, with the given fragment files. */
function createRepository(
  version: string,
  fragmentFileNames: readonly string[],
): string {
  const repository = mkdtempSync(join(tmpdir(), "api-client-version-"));
  temporaryRepositories.push(repository);
  const fragmentDirectory = join(repository, PACKAGE_PATH, "changelog.d");
  mkdirSync(fragmentDirectory, { recursive: true });
  writeFileSync(join(fragmentDirectory, ".gitkeep"), "");
  for (const fragmentFileName of fragmentFileNames) {
    writeFileSync(join(fragmentDirectory, fragmentFileName), "A change.\n");
  }
  writeFileSync(
    join(repository, PACKAGE_PATH, "package.json"),
    `${JSON.stringify({ name: "@policyengine/api-client", version, files: ["dist"] }, null, 2)}\n`,
  );
  writeFileSync(join(repository, "bun.lock"), lockfileFor(version));
  return repository;
}

function raiseVersion(repository: string) {
  return spawnSync(process.execPath, [RAISE_VERSION_SCRIPT], {
    cwd: repository,
    encoding: "utf8",
  });
}

function manifestText(repository: string): string {
  return readFileSync(join(repository, PACKAGE_PATH, "package.json"), "utf8");
}

afterEach(() => {
  for (const repository of temporaryRepositories.splice(0)) {
    rmSync(repository, { recursive: true, force: true });
  }
});

describe("raising the package version from changelog fragments", () => {
  test.each([
    ["fixed", "0.1.1", "0.1.2"],
    ["changed", "0.1.1", "0.1.2"],
    ["added", "0.1.1", "0.2.0"],
    ["removed", "0.1.1", "0.2.0"],
    ["breaking", "0.1.1", "0.2.0"],
    ["fixed", "1.2.3", "1.2.4"],
    ["added", "1.2.3", "1.3.0"],
    ["removed", "1.2.3", "1.3.0"],
    ["breaking", "1.2.3", "2.0.0"],
  ])(
    "given a %s fragment on version %s then the version becomes %s",
    (fragmentType, currentVersion, expectedVersion) => {
      // Given
      const repository = createRepository(currentVersion, [
        `some-change.${fragmentType}.md`,
      ]);

      // When
      const result = raiseVersion(repository);

      // Then
      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout.trim()).toBe(expectedVersion);
      expect(JSON.parse(manifestText(repository)).version).toBe(
        expectedVersion,
      );
    },
  );

  test("given fragments of several types then the largest raise applies once", () => {
    // Given
    const repository = createRepository("1.2.3", [
      "first.fixed.md",
      "second.added.md",
      "third.changed.md",
    ]);

    // When
    const result = raiseVersion(repository);

    // Then
    expect(result.stdout.trim()).toBe("1.3.0");
  });

  test("given a raise then the lockfile's entry for this package follows and no other entry changes", () => {
    // Given
    const repository = createRepository("0.1.1", ["some-change.fixed.md"]);

    // When
    raiseVersion(repository);

    // Then
    expect(readFileSync(join(repository, "bun.lock"), "utf8")).toBe(
      lockfileFor("0.1.1").replace(
        `"name": "@policyengine/api-client",\n      "version": "0.1.1"`,
        `"name": "@policyengine/api-client",\n      "version": "0.1.2"`,
      ),
    );
  });

  test("given a raise then only the manifest's version changes", () => {
    // Given
    const repository = createRepository("0.1.1", ["some-change.fixed.md"]);
    const manifestBefore = manifestText(repository);

    // When
    raiseVersion(repository);

    // Then
    expect(manifestText(repository)).toBe(
      manifestBefore.replace('"version": "0.1.1"', '"version": "0.1.2"'),
    );
  });

  test("given no fragments then it fails and changes nothing", () => {
    // Given
    const repository = createRepository("0.1.1", []);
    const manifestBefore = manifestText(repository);

    // When
    const result = raiseVersion(repository);

    // Then
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("no changelog fragments");
    expect(manifestText(repository)).toBe(manifestBefore);
  });

  test("given a fragment with an unknown type then it names the file and changes nothing", () => {
    // Given
    const repository = createRepository("0.1.1", [
      "good.fixed.md",
      "bad.improved.md",
    ]);
    const manifestBefore = manifestText(repository);

    // When
    const result = raiseVersion(repository);

    // Then
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("bad.improved.md");
    expect(manifestText(repository)).toBe(manifestBefore);
  });

  test("given a lockfile without this package then it fails and leaves the manifest alone", () => {
    // Given
    const repository = createRepository("0.1.1", ["some-change.fixed.md"]);
    writeFileSync(join(repository, "bun.lock"), "{}\n");
    const manifestBefore = manifestText(repository);

    // When
    const result = raiseVersion(repository);

    // Then
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("bun.lock");
    expect(manifestText(repository)).toBe(manifestBefore);
  });
});
