const LEGACY_V1_REPORT_COUNTRY_IDS = ["uk", "us", "ca", "ng"] as const;
const LEGACY_V1_REPORT_SURFACES = ["policy", "household"] as const;

const LEGACY_V1_REPORT_PATH_PATTERN = new RegExp(
  `^/(?:${LEGACY_V1_REPORT_COUNTRY_IDS.join("|")})/(?:${LEGACY_V1_REPORT_SURFACES.join("|")})(?:/.*)?$`,
);

/**
 * Returns the legacy app URL for strict v1 report routes, otherwise null.
 *
 * This intentionally matches only the code-proven v1 report surfaces:
 * /:countryId/policy and /:countryId/household.
 * It does not match historical population-impact links.
 */
export function getLegacyAppRedirectUrl(input: URL | string): string | null {
  const url =
    typeof input === "string" ? new URL(input) : new URL(input.toString());

  if (url.hostname.startsWith("legacy.")) {
    return null;
  }

  if (!LEGACY_V1_REPORT_PATH_PATTERN.test(url.pathname)) {
    return null;
  }

  url.hostname = `legacy.${url.hostname}`;
  return url.toString();
}
