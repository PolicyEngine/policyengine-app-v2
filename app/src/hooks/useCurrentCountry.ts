import { useParams } from 'react-router-dom';
import { countryIds } from '@/libs/countries';

/**
 * Returns the current country ID from the URL path parameter.
 *
 * For routes with :countryId param: Returns the country from URL (already validated by loader)
 * For routes without :countryId param: Returns 'us' as fallback with a warning
 *
 * @returns The country ID from URL or default fallback
 */
export function useCurrentCountry(): (typeof countryIds)[number] {
  const { countryId } = useParams<{ countryId: string }>();

  if (!countryId) {
    console.warn('useCurrentCountry used in non-country route, returning default country');
    // TODO: Replace with dynamic default country based on user location/preferences
    return 'us';
  }

  return countryId as (typeof countryIds)[number];
}
