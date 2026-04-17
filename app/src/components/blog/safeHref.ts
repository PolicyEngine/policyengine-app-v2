/**
 * Return true if `href` can safely be rendered as the `href` attribute of an
 * `<a>` tag inside user-supplied markdown.
 *
 * We allow:
 *   - http(s) URLs
 *   - mailto: and tel: URIs
 *   - fragment-only hrefs (e.g. "#footnote-1") and relative paths (e.g. "/us")
 *
 * We explicitly reject:
 *   - javascript: URIs (XSS)
 *   - data: URIs (can carry HTML / JS)
 *   - vbscript: URIs (legacy IE)
 *   - file: URIs
 *   - Anything with a scheme we don't know about
 *
 * Keep this in sync with website/src/components/blog/safeHref.ts until the
 * duplication tracked in #990 is removed.
 */
const SAFE_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:']);

export function isSafeHref(href: string | undefined | null): boolean {
  if (!href) {
    return false;
  }
  const trimmed = href.trim();
  if (trimmed.length === 0) {
    return false;
  }
  // Protocol-relative URLs ("//example.com/path") inherit the page's scheme,
  // which is fine in our https-only deployment but we reject them explicitly
  // for consistency across environments. Must be checked before the plain
  // "/"-prefix check below.
  if (trimmed.startsWith('//')) {
    return false;
  }
  // Fragment-only and schemeless relative paths are safe.
  if (trimmed.startsWith('#') || trimmed.startsWith('/')) {
    return true;
  }
  try {
    // Use a dummy base so plain paths like "foo/bar" don't blow up.
    const parsed = new URL(trimmed, 'https://placeholder.invalid/');
    // If the parsed URL's origin is our placeholder then the input was
    // schemeless relative text — already handled above, but safe to accept.
    if (parsed.origin === 'https://placeholder.invalid') {
      return true;
    }
    return SAFE_SCHEMES.has(parsed.protocol);
  } catch {
    return false;
  }
}
