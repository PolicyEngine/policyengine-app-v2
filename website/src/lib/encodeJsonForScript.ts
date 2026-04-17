/**
 * Encode an arbitrary JSON-serializable value for safe embedding inside a
 * `<script type="application/ld+json">` tag or similar inline script context.
 *
 * The HTML spec terminates a script element when it encounters a raw `</script`
 * sequence. Any `<` inside JSON therefore must be escaped so that attacker-
 * controlled data cannot break out of the script block and inject markup.
 *
 * We escape `<` as its JSON unicode escape (`\u003c`), which keeps the output
 * valid JSON while ensuring the browser never sees a literal `<` inside the
 * script body.
 */
export function encodeJsonForScript(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
