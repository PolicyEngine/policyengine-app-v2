/**
 * Return true if `href` can safely be rendered as the `href` attribute of an
 * `<a>` tag inside user-supplied markdown.
 *
 * Keep this in sync with app/src/components/blog/safeHref.ts until the
 * duplication tracked in #990 is removed.
 */
const SAFE_SCHEMES = new Set(["http:", "https:", "mailto:", "tel:"]);

export function isSafeHref(href: string | undefined | null): boolean {
  if (!href) {
    return false;
  }
  const trimmed = href.trim();
  if (trimmed.length === 0) {
    return false;
  }
  if (trimmed.startsWith("//")) {
    return false;
  }
  if (trimmed.startsWith("#") || trimmed.startsWith("/")) {
    return true;
  }
  try {
    const parsed = new URL(trimmed, "https://placeholder.invalid/");
    if (parsed.origin === "https://placeholder.invalid") {
      return true;
    }
    return SAFE_SCHEMES.has(parsed.protocol);
  } catch {
    return false;
  }
}
