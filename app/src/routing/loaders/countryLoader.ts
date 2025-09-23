import { redirect } from 'react-router-dom';
import { countryIds } from '@/libs/countries';

/**
 * Loader function that validates the country parameter in the URL.
 * Redirects to /us if the country is invalid or unsupported.
 */
export async function validateCountryLoader({ params }: { params: { countryId?: string } }) {
  const { countryId } = params;

  // Check if countryId exists and is valid
  if (!countryId || !countryIds.includes(countryId as any)) {
    // Get the current full path to preserve any sub-paths
    const currentPath = window.location.pathname;
    const pathAfterCountry = currentPath.substring(countryId ? countryId.length + 1 : 0);

    // TODO: Replace 'us' with dynamic default country based on user location/preferences
    const defaultCountry = 'us';

    // Redirect to default country while preserving the rest of the path
    return redirect(`/${defaultCountry}${pathAfterCountry}`);
  }

  // Country is valid, continue with normal loading
  return null;
}
