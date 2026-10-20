import { countryIds, DEFAULT_COUNTRY } from "@/libs/countries";

/**
 * The Reports page the error pages link to. `countryId` is the visitor's
 * country when the route has one. A value that is not a supported country
 * ID, or no value, links to the US Reports page.
 */
export function reportsHref(countryId: unknown): string {
  const country = countryIds.find((id) => id === countryId) ?? DEFAULT_COUNTRY;
  return `/${country}/reports`;
}

/**
 * The first segment of a URL path, which is the country on country routes:
 * `"uk"` for `/uk/reports`. Undefined for `/`.
 *
 * The segment is decoded, as Next.js decodes route params: `usePathname()`
 * gives `/%75k/reports` for a request to that path, while the route's
 * `countryId` is `"uk"`.
 */
export function firstPathSegment(pathname: string): string | undefined {
  const segment = pathname.split("/").filter(Boolean)[0];
  if (segment === undefined) {
    return undefined;
  }
  try {
    return decodeURIComponent(segment);
  } catch {
    // Malformed percent-encoding, which Next.js rejects as a route param.
    return segment;
  }
}
