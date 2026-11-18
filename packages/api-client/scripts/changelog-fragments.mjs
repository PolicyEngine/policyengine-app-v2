// What the release scripts share about changelog fragments. Paths are relative
// to the repository root, which is where the scripts run.

export const PACKAGE_DIRECTORY = "packages/api-client";
export const FRAGMENT_DIRECTORY = `${PACKAGE_DIRECTORY}/changelog.d`;
export const FRAGMENT_PLACEHOLDER = ".gitkeep";

/** Each fragment type and the part of the version it raises. */
const VERSION_PART_BY_TYPE = {
  breaking: "major",
  added: "minor",
  removed: "minor",
  changed: "patch",
  fixed: "patch",
};

export const FRAGMENT_TYPES = Object.keys(VERSION_PART_BY_TYPE);

const FRAGMENT_FILE_NAME = new RegExp(
  `^[A-Za-z0-9][A-Za-z0-9_-]*\\.(${FRAGMENT_TYPES.join("|")})\\.md$`,
);

/** The type in a fragment's file name, or undefined if the name is not valid. */
export function fragmentType(fileName) {
  return FRAGMENT_FILE_NAME.exec(fileName)?.[1];
}

/**
 * The version after a release with fragments of these types. The largest raise
 * applies, once. While the major version is 0, a breaking change raises the
 * minor version, so that 1.0.0 is only ever a deliberate step.
 */
export function nextVersion(currentVersion, fragmentTypes) {
  const versionMatch = /^(\d+)\.(\d+)\.(\d+)$/.exec(currentVersion);
  if (versionMatch === null) {
    throw new Error(`"${currentVersion}" is not a major.minor.patch version.`);
  }
  const [major, minor, patch] = versionMatch.slice(1).map(Number);
  const versionParts = fragmentTypes.map((type) => VERSION_PART_BY_TYPE[type]);

  if (versionParts.includes("major") && major > 0) {
    return `${major + 1}.0.0`;
  }
  if (versionParts.includes("major") || versionParts.includes("minor")) {
    return `${major}.${minor + 1}.0`;
  }
  return `${major}.${minor}.${patch + 1}`;
}
