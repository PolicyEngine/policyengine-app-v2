/**
 * Maps ISO country codes to PolicyEngine route codes
 */

// Mapping from ISO 3166-1 alpha-2 codes to PolicyEngine routes
const ISO_TO_ROUTE_MAP: Record<string, string> = {
  US: 'us', // United States
  GB: 'uk', // United Kingdom (Great Britain)
  UK: 'uk', // Alternative code sometimes used
  CA: 'ca', // Canada
  NG: 'ng', // Nigeria
  IL: 'il', // Israel
};

/**
 * Converts ISO country code to PolicyEngine route code
 * @param isoCode - ISO 3166-1 alpha-2 country code (e.g., 'US', 'GB')
 * @returns PolicyEngine route code (e.g., 'us', 'uk') or null if not supported
 */
export function mapIsoToRoute(isoCode: string): string | null {
  const upperCode = isoCode?.toUpperCase();
  return ISO_TO_ROUTE_MAP[upperCode] || null;
}

/**
 * Checks if a country is supported by PolicyEngine
 * @param isoCode - ISO 3166-1 alpha-2 country code
 */
export function isSupportedCountry(isoCode: string): boolean {
  return mapIsoToRoute(isoCode) !== null;
}

/**
 * Gets the default country for fallback
 */
export function getDefaultCountry(): string {
  return 'us';
}
