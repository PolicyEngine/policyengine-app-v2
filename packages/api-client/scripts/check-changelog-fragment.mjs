#!/usr/bin/env node
// Fails when the change between two commits needs a changelog fragment and has
// none, or adds a file to changelog.d that the release could not use. It runs
// on every pull request and decides here whether a fragment is needed, so that
// it always reports a result. Run from the repository root:
//
//   node packages/api-client/scripts/check-changelog-fragment.mjs HEAD^1 HEAD
//
// On a pull request, HEAD is GitHub's merge commit and HEAD^1 is the base
// branch, so the difference is exactly what merging would change.

import { execFileSync } from "node:child_process";
import {
  FRAGMENT_DIRECTORY,
  FRAGMENT_PLACEHOLDER,
  FRAGMENT_TYPES,
  PACKAGE_DIRECTORY,
  fragmentType,
} from "./changelog-fragments.mjs";

/** Files whose changes alter what npm ships or how it is built. */
const SHIPPED_FILES = new Set([
  `${PACKAGE_DIRECTORY}/README.md`,
  `${PACKAGE_DIRECTORY}/LICENSE`,
  `${PACKAGE_DIRECTORY}/tsconfig.json`,
  `${PACKAGE_DIRECTORY}/tsconfig.build.json`,
]);
const SHIPPED_SOURCE_PREFIX = `${PACKAGE_DIRECTORY}/src/`;
const MANIFEST_PATH = `${PACKAGE_DIRECTORY}/package.json`;
/** package.json fields that change nothing for someone installing the package. */
const DEVELOPMENT_ONLY_MANIFEST_FIELDS = ["devDependencies", "scripts"];
const DELETED = "D";

function git(...gitArguments) {
  return execFileSync("git", gitArguments, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

/** The package's changed files between two commits, with git's status letters. */
function changedPackageFiles(baseCommit, headCommit) {
  const fields = git(
    "diff",
    "--name-status",
    "--no-renames",
    "-z",
    baseCommit,
    headCommit,
    "--",
    PACKAGE_DIRECTORY,
  )
    .split("\0")
    .filter(Boolean);
  const changedFiles = [];
  for (let index = 0; index < fields.length; index += 2) {
    changedFiles.push({ status: fields[index], path: fields[index + 1] });
  }
  return changedFiles;
}

/** JSON text that does not depend on the order of object keys. */
function canonicalJson(value) {
  return JSON.stringify(value, (_key, nestedValue) =>
    nestedValue !== null &&
    typeof nestedValue === "object" &&
    !Array.isArray(nestedValue)
      ? Object.fromEntries(
          Object.entries(nestedValue).sort(([firstKey], [secondKey]) =>
            firstKey.localeCompare(secondKey),
          ),
        )
      : nestedValue,
  );
}

function manifestWithoutDevelopmentFields(commit) {
  const manifest = JSON.parse(git("show", `${commit}:${MANIFEST_PATH}`));
  for (const fieldName of DEVELOPMENT_ONLY_MANIFEST_FIELDS) {
    delete manifest[fieldName];
  }
  return canonicalJson(manifest);
}

function manifestChangeShips(baseCommit, headCommit) {
  try {
    return (
      manifestWithoutDevelopmentFields(baseCommit) !==
      manifestWithoutDevelopmentFields(headCommit)
    );
  } catch {
    // Added, removed or unparsable: not a change that can be ruled harmless.
    return true;
  }
}

function changeNeedsFragment({ path }, baseCommit, headCommit) {
  if (path === MANIFEST_PATH) {
    return manifestChangeShips(baseCommit, headCommit);
  }
  return SHIPPED_FILES.has(path) || path.startsWith(SHIPPED_SOURCE_PREFIX);
}

/** Why a file added to changelog.d cannot be used, or undefined if it can. */
function fragmentProblem(path, headCommit) {
  const fileName = path.slice(FRAGMENT_DIRECTORY.length + 1);
  if (fragmentType(fileName) === undefined) {
    return `${path} is not named <name>.<type>.md directly in changelog.d.`;
  }
  if (git("show", `${headCommit}:${path}`).trim() === "") {
    return `${path} is empty.`;
  }
  return undefined;
}

function reportFailure(message) {
  console.log(`::error::${message}`);
  process.exitCode = 1;
}

const [baseCommit, headCommit] = process.argv.slice(2);
if (baseCommit === undefined || headCommit === undefined) {
  console.error("Usage: check-changelog-fragment.mjs <base> <head>");
  process.exit(2);
}

const changedFiles = changedPackageFiles(baseCommit, headCommit);
const fragmentPaths = changedFiles
  .filter(
    ({ status, path }) =>
      status !== DELETED &&
      path.startsWith(`${FRAGMENT_DIRECTORY}/`) &&
      path !== `${FRAGMENT_DIRECTORY}/${FRAGMENT_PLACEHOLDER}`,
  )
  .map(({ path }) => path);
const fragmentProblems = fragmentPaths
  .map((path) => fragmentProblem(path, headCommit))
  .filter((problem) => problem !== undefined);

for (const problem of fragmentProblems) {
  reportFailure(`${problem} Valid types: ${FRAGMENT_TYPES.join(", ")}.`);
}

const filesNeedingFragment = changedFiles
  .filter((changedFile) =>
    changeNeedsFragment(changedFile, baseCommit, headCommit),
  )
  .map(({ path }) => path);

if (filesNeedingFragment.length === 0) {
  console.log("No change to what @policyengine/api-client ships.");
} else if (fragmentPaths.length === 0) {
  reportFailure(
    `This PR changes what @policyengine/api-client ships (${filesNeedingFragment.join(", ")}). ` +
      `Add ${FRAGMENT_DIRECTORY}/<name>.<type>.md describing the change. ` +
      `Valid types: ${FRAGMENT_TYPES.join(", ")}.`,
  );
} else if (fragmentProblems.length === 0) {
  console.log(`Changelog fragments: ${fragmentPaths.join(", ")}.`);
}
