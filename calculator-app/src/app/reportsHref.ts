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
 */
export function firstPathSegment(pathname: string): string | undefined {
  return pathname.split("/").filter(Boolean)[0];
}
