import { WEBSITE_URL } from '@/constants';
import { useAppMode } from '@/contexts/AppContext';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

/**
 * Hook for generating website URLs with context-aware navigation.
 *
 * - In the website app: returns relative paths (e.g., '/us/research')
 * - In the calculator app: returns absolute URLs (e.g., 'https://policyengine.org/us/research')
 *
 * Components can check if the returned path starts with '/' to determine
 * whether to use React Router's Link (relative) or <a> (absolute).
 *
 * @example
 * ```tsx
 * const { getWebsitePath } = useWebsitePath();
 * const href = getWebsitePath('/research');
 *
 * // Render based on path type
 * href.startsWith('/') ? <Link to={href}>Research</Link> : <a href={href}>Research</a>
 * ```
 */
export function useWebsitePath() {
  const appMode = useAppMode();
  const countryId = useCurrentCountry();

  /**
   * Generate a path to a website page.
   *
   * @param path - The path segment (e.g., '/research', '/team')
   * @returns Relative path for website app, absolute URL for calculator app
   */
  const getWebsitePath = (path: string): string => {
    return appMode === 'website'
      ? `/${countryId}${path}`
      : `${WEBSITE_URL}/${countryId}${path}`;
  };

  /**
   * Generate the home/logo link href.
   *
   * @returns Relative path for website app, absolute URL for calculator app
   */
  const getHomeHref = (): string => {
    return appMode === 'website' ? `/${countryId}` : `${WEBSITE_URL}/${countryId}`;
  };

  return {
    getWebsitePath,
    getHomeHref,
    appMode,
    countryId,
  };
}
