import { describe, expect, test } from "vitest";
import { encodeJsonForScript } from "../../lib/encodeJsonForScript";

describe("encodeJsonForScript", () => {
  test("escapes raw '<' characters as \\u003c", () => {
    const payload = { html: "<script>alert(1)</script>" };
    const encoded = encodeJsonForScript(payload);

    expect(encoded).not.toContain("<");
    // '>' is not escaped (only '<' can terminate a script tag); this mirrors
    // the shared behavior used by middleware.ts.
    expect(encoded).toContain("\\u003cscript>alert(1)\\u003c/script>");
  });

  test("prevents </script> breakout sequences", () => {
    const payload = { note: "end </script><img src=x onerror=alert(1)>" };
    const encoded = encodeJsonForScript(payload);

    expect(encoded).not.toContain("</script>");
    // Every '<' should be escaped
    expect(encoded.match(/</g)).toBeNull();
  });

  test("round-trips to the original value via JSON.parse", () => {
    const payload = {
      title: "Article about <policy>",
      nested: { items: ["a", "<b>", "c"] },
    };

    const encoded = encodeJsonForScript(payload);
    // The encoded string is valid JSON, since \u003c is a valid JSON escape.
    expect(JSON.parse(encoded)).toEqual(payload);
  });

  test("handles primitives and nulls", () => {
    expect(encodeJsonForScript("hello")).toBe('"hello"');
    expect(encodeJsonForScript(42)).toBe("42");
    expect(encodeJsonForScript(null)).toBe("null");
    expect(encodeJsonForScript(true)).toBe("true");
  });

  test("escapes every occurrence, not just the first", () => {
    const payload = "<<<<";
    const encoded = encodeJsonForScript(payload);
    // Four escapes, wrapped in quotes
    expect(encoded).toBe('"\\u003c\\u003c\\u003c\\u003c"');
  });
});
