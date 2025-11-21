import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Navigate, Outlet, useParams } from 'react-router-dom';
import { countryIds } from '@/libs/countries';
import { setCurrentCountry } from '@/reducers/metadataReducer';
import { AppDispatch } from '@/store';

/**
 * Guard component that validates country parameter in the route.
 *
 * Architecture:
 * - URL parameter is the single source of truth for country
 * - This guard validates the country parameter
 * - Components read country directly from URL via useCurrentCountry() hook
 * - Syncs to Redux state for metadata loading
 *
 * Flow:
 * 1. Validates countryId from URL parameter
 * 2. If valid, syncs to Redux metadata state
 * 3. If invalid, redirects to root path
 *
 * Acts as a layout component that either redirects or renders child routes.
 */
export function CountryGuard() {
  const { countryId } = useParams<{ countryId: string }>();
  const dispatch = useDispatch<AppDispatch>();

  // Validation logic
  const isValid = countryId && countryIds.includes(countryId as any);

  // Sync country to Redux for metadata loading
  useEffect(() => {
    if (isValid && countryId) {
      dispatch(setCurrentCountry(countryId));
    }
  }, [countryId, isValid, dispatch]);

  if (!isValid) {
    // Redirect to root path and let the root route handler determine the country.
    return <Navigate to="/" replace />;
  }

  // Render child routes when validation passes.
  return <Outlet />;
}
