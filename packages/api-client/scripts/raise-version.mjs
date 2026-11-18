#!/usr/bin/env node
// Raises the package's version according to the fragments in changelog.d and
// prints the new version. It changes package.json and bun.lock's copy of the
// version, which Bun does not update by itself. Run from the repository root.

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import {
  FRAGMENT_DIRECTORY,
  FRAGMENT_PLACEHOLDER,
  PACKAGE_DIRECTORY,
  fragmentType,
  nextVersion,
} from "./changelog-fragments.mjs";

const MANIFEST_PATH = `${PACKAGE_DIRECTORY}/package.json`;
const LOCKFILE_PATH = "bun.lock";
const LOCKFILE_VERSION =
  /("packages\/api-client": \{\s*"name": "@policyengine\/api-client",\s*"version": ")[^"]*(")/;

function stopWith(message) {
  console.error(message);
  process.exit(1);
}

const fragmentFileNames = readdirSync(FRAGMENT_DIRECTORY).filter(
  (fileName) => fileName !== FRAGMENT_PLACEHOLDER,
);
if (fragmentFileNames.length === 0) {
  stopWith(`${FRAGMENT_DIRECTORY} has no changelog fragments.`);
}

const invalidFileNames = fragmentFileNames.filter(
  (fileName) => fragmentType(fileName) === undefined,
);
if (invalidFileNames.length > 0) {
  stopWith(
    `Not valid changelog fragment names: ${invalidFileNames.join(", ")}.`,
  );
}

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
const lockfile = readFileSync(LOCKFILE_PATH, "utf8");
if (!LOCKFILE_VERSION.test(lockfile)) {
  stopWith(`${LOCKFILE_PATH} has no version for ${manifest.name}.`);
}

const raisedVersion = nextVersion(
  manifest.version,
  fragmentFileNames.map(fragmentType),
);
writeFileSync(
  MANIFEST_PATH,
  `${JSON.stringify({ ...manifest, version: raisedVersion }, null, 2)}\n`,
);
writeFileSync(
  LOCKFILE_PATH,
  lockfile.replace(LOCKFILE_VERSION, `$1${raisedVersion}$2`),
);
console.log(raisedVersion);
