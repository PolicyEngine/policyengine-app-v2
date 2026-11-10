/**
 * Whether a Content-Type names JSON: `application/json` or any
 * `application/...+json` type, whatever its parameters and letter case.
 * Shared by the forwarding package (for the Public API's answers) and the
 * routes that use it (for request bodies).
 */
export function isJsonMediaType(contentType: string | null): boolean {
  if (contentType === null) {
    return false;
  }
  const mediaType = contentType.split(";")[0].trim().toLowerCase();
  const [type, subtype] = mediaType.split("/");
  if (type !== "application" || subtype === undefined) {
    return false;
  }
  return (
    subtype === "json" ||
    (subtype.endsWith("+json") && subtype.length > "+json".length)
  );
}
