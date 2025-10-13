import { useEffect } from 'react';
import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { countryIds } from '@/libs/countries';
import { setCurrentCountry } from '@/reducers/metadataReducer';

/**
 * Guard component that validates country parameter in the route.
 *
 * Architecture:
 * - URL parameter is the single source of truth for country
 * - This guard validates the country parameter
 * - Components read country directly from URL via useCurrentCountry() hook
 * - Optionally syncs to Redux state for use in Redux middleware/selectors
 *
 * Flow:
 * 1. Validates countryId from URL parameter
 * 2. If valid, renders children and optionally syncs to Redux
 * 3. If invalid, redirects to root path
 *
 * Acts as a layout component that either redirects or renders child routes.
 */
export function CountryGuard() {
  const { countryId } = useParams<{ countryId: string }>();
  const dispatch = useDispatch();

  // Validation logic
  const isValid = countryId && countryIds.includes(countryId as any);

  // Optionally sync valid country ID to Redux state
  // This is for Redux-only use cases (e.g., metadata loading in middleware)
  // Components should use useCurrentCountry() hook to read from URL directly
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
