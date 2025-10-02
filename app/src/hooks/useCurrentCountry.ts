import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { countryIds } from '@/libs/countries';

/**
 * Returns the current country ID from the URL path parameter.
 * Updates localStorage when user manually navigates to a different country.
 *
 * For routes with :countryId param: Returns the country from URL (already validated by loader)
 * For routes without :countryId param: Returns 'us' as fallback with a warning
 *
 * @returns The country ID from URL or default fallback
 */
export function useCurrentCountry(): (typeof countryIds)[number] {
  const { countryId } = useParams<{ countryId: string }>();

  useEffect(() => {
    // When user manually navigates to a different country, update localStorage
    // to respect their choice and prevent auto-redirect back to detected country
    if (countryId) {
      const cachedData = localStorage.getItem('detectedCountry');
      if (cachedData) {
        try {
          const { country } = JSON.parse(cachedData);
          // If the URL country is different from cached, update cache
          if (country !== countryId) {
            localStorage.setItem(
              'detectedCountry',
              JSON.stringify({
                country: countryId,
                timestamp: Date.now(),
              })
            );
          }
        } catch {
          // Invalid cached data format, will be handled by RedirectToCountry
        }
      } else {
        // No cached country yet, save the current one
        localStorage.setItem(
          'detectedCountry',
          JSON.stringify({
            country: countryId,
            timestamp: Date.now(),
          })
        );
      }
    }
  }, [countryId]);

  if (!countryId) {
    console.warn('useCurrentCountry used in non-country route, returning default country');
    // TODO: Replace with dynamic default country based on user location/preferences
    return 'us';
  }

  return countryId as (typeof countryIds)[number];
}
