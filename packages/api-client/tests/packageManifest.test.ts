import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const MANIFEST = JSON.parse(
  readFileSync(join(__dirname, "..", "package.json"), "utf8"),
) as {
  publishConfig?: Record<string, unknown>;
  exports: Record<string, Record<string, string>>;
};

describe("the package manifest", () => {
  test("given a scope owner publishing the first version by hand then npm is not forced to generate provenance, which only CI can", () => {
    // Then
    expect(MANIFEST.publishConfig?.provenance).toBeUndefined();
  });

  test("given a CommonJS consumer then the package export has a default condition", () => {
    // Then
    expect(MANIFEST.exports["."].default).toBe("./dist/index.js");
  });
});
