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

  test("given the package is MIT-licensed then it ships the licence text with PolicyEngine's copyright notice", () => {
    // Given
    const licenseExists = existsSync(LICENSE_PATH);
    const licenseText = licenseExists ? readFileSync(LICENSE_PATH, "utf8") : "";

    // Then
    expect(licenseExists).toBe(true);
    expect(licenseText).toMatch(/^MIT License\n/);
    expect(licenseText).toContain("Copyright (c) 2026 PolicyEngine");
    expect(licenseText).toContain(
      "Permission is hereby granted, free of charge, to any person obtaining a copy",
    );
  });
});
