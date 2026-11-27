import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const PACKAGE_DIRECTORY = join(__dirname, "..");
const MANIFEST = JSON.parse(
  readFileSync(join(PACKAGE_DIRECTORY, "package.json"), "utf8"),
) as {
  license?: string;
  publishConfig?: Record<string, unknown>;
  exports: Record<string, Record<string, string>>;
};
const LICENSE_PATH = join(PACKAGE_DIRECTORY, "LICENSE");
/**
 * The SPDX "MIT" text with PolicyEngine's notice. npm publishes a LICENSE
 * file in the package's root whatever the manifest's "files" field lists.
 */
const EXPECTED_MIT_LICENSE = `MIT License

Copyright (c) 2026 PolicyEngine

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;

describe("the package manifest", () => {
  test("given a scope owner publishing the first version by hand then npm is not forced to generate provenance, which only CI can", () => {
    // Then
    expect(MANIFEST.publishConfig?.provenance).toBeUndefined();
  });

  test("given a CommonJS consumer then the package export has a default condition", () => {
    // Then
    expect(MANIFEST.exports["."].default).toBe("./dist/index.js");
  });

  test("given the package is MIT-licensed then the manifest declares the MIT identifier", () => {
    // Then
    expect(MANIFEST.license).toBe("MIT");
  });

  test("given the package is MIT-licensed then its directory has the whole MIT text with PolicyEngine's copyright notice", () => {
    // Given
    const licenseExists = existsSync(LICENSE_PATH);
    const licenseText = licenseExists ? readFileSync(LICENSE_PATH, "utf8") : "";

    // Then
    expect(licenseExists).toBe(true);
    expect(licenseText).toBe(EXPECTED_MIT_LICENSE);
  });
});
