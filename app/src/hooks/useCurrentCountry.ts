import { useParams } from 'react-router-dom';
import { countryIds } from '@/libs/countries';

/**
 * Returns the current country ID from the URL path parameter.
 * @returns The validated country ID from URL, or 'us' as fallback
 */
export function useCurrentCountry(): (typeof countryIds)[number] {
  const { countryId } = useParams<{ countryId: string }>();

  // Validate and provide fallback
  if (!countryId || !countryIds.includes(countryId as any)) {
    // In production, you might want to redirect or handle this differently
    console.warn(`Invalid or missing country ID in URL: ${countryId}`);
    return 'us';
  }

  return countryId as (typeof countryIds)[number];
}
