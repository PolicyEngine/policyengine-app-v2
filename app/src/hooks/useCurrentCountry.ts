import { useCountryContext } from '@/contexts/CountryContext';
import { countryIds, type CountryId } from '@/libs/countries';

/**
 * Returns the current country ID from context.
 *
 * The country is set by a CountryProvider higher in the tree: calculator-app's
 * [countryId]/layout.tsx reads the Next.js params and provides it.
 *
 * @returns The country ID
 * @throws {Error} If called outside a CountryProvider or if country is invalid
 */
export function useCurrentCountry(): CountryId {
  const countryId = useCountryContext();

  if (!countryId || !countryIds.includes(countryId as any)) {
    throw new Error(
      'useCurrentCountry must be used within a CountryProvider. ' + `Got countryId: ${countryId}`
    );
  }

  return countryId as CountryId;
}
