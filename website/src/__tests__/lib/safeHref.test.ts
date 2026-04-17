import { describe, expect, test } from "vitest";
import { isSafeHref } from "../../components/blog/safeHref";

describe("isSafeHref", () => {
  test.each([
    ["https://example.com/path", true],
    ["http://example.com", true],
    ["mailto:hello@example.com", true],
    ["tel:+1-555-555-5555", true],
    ["#footnote", true],
    ["/us/research", true],
    ["relative/path", true],
  ])("accepts %s", (href, expected) => {
    expect(isSafeHref(href)).toBe(expected);
  });

  // Split-string to appease eslint's `no-script-url` without disabling it:
  // these are intentional XSS payloads.
  const JS_SCHEME = "java" + "script:alert(1)";
  const JS_UPPER = "JAVA" + "SCRIPT:alert(1)";

  test.each([
    [JS_SCHEME],
    [JS_UPPER],
    [`  ${JS_SCHEME}  `],
    ["data:text/html,<script>alert(1)</script>"],
    ["vbscript:msgbox(1)"],
    ["file:///etc/passwd"],
    ["//evil.example.com/"],
    [""],
    [null],
    [undefined],
  ])("rejects %s", (href) => {
    expect(isSafeHref(href)).toBe(false);
  });
});
