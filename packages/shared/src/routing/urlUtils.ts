/**
 * URL utilities for country-based routing
 */

/**
 * Replaces the country segment in a URL path with a new country ID.
 * Assumes the country is always the first path segment (e.g., /us/reports -> /uk/reports)
 *
 * @param path - The current URL path (e.g., "/us/reports/123")
 * @param newCountryId - The new country ID to use (e.g., "uk")
 * @returns The path with the country replaced (e.g., "/uk/reports/123")
 *
 * @example
 * replaceCountryInPath('/us/reports', 'uk') // => '/uk/reports'
 * replaceCountryInPath('/us', 'uk') // => '/uk'
 * replaceCountryInPath('/', 'uk') // => '/uk'
 */
export function replaceCountryInPath(path: string, newCountryId: string): string {
  // Handle empty or root path
  if (!path || path === '/') {
    return `/${newCountryId}`;
  }

  // Replace the first path segment (country) with the new country ID
  return path.replace(/^\/[^/]+/, `/${newCountryId}`);
}
