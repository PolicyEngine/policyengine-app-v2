const LEGACY_V1_REPORT_COUNTRY_IDS = ["uk", "us", "ca", "ng"] as const;
const LEGACY_V1_REPORT_SURFACES = ["policy", "household"] as const;
const EXCLUDED_HOST_PREFIXES = ["legacy.", "app."] as const;

// WARNING: These singular route namespaces are permanently reserved for
// legacy-app redirects.
//
// ABSOLUTELY DO NOT add new website or calculator-next routes under:
// - /:countryId/policy
// - /:countryId/policy/*
// - /:countryId/household
// - /:countryId/household/*
//
// Any request matching those paths is redirected to the legacy app host by
// this file. Reusing them for v2 would silently break those pages.
//
// Keep v2 routes on distinct namespaces instead, for example:
// - /:countryId/policies
// - /:countryId/households
// - /:countryId/report-output/:reportId
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

  if (
    EXCLUDED_HOST_PREFIXES.some((prefix) => url.hostname.startsWith(prefix))
  ) {
    return null;
  }

  if (!LEGACY_V1_REPORT_PATH_PATTERN.test(url.pathname)) {
    return null;
  }

  url.hostname = `legacy.${url.hostname}`;
  return url.toString();
}
