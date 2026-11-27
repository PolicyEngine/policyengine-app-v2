import { describe, expect, test } from "vitest";

import { isJsonMediaType } from "../src/mediaType";

describe("isJsonMediaType", () => {
  test.each([
    ["application/json", true],
    ["application/json; charset=utf-8", true],
    ["Application/JSON", true],
    ["application/merge-patch+json", true],
    ["application/vnd.policyengine+json; charset=utf-8", true],
    ["text/plain", false],
    ["text/html; charset=utf-8", false],
    ["application/jsonp", false],
    ["application/json/extra", false],
    ["application/+json", false],
    ["text/plain+json", false],
    ["", false],
    [null, false],
  ])("given %s then it returns %s", (contentType, expected) => {
    // When / Then
    expect(isJsonMediaType(contentType)).toBe(expected);
  });
});
