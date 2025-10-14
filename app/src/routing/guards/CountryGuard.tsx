import { useEffect } from 'react';
import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { countryIds } from '@/libs/countries';
import { setCurrentCountry } from '@/reducers/metadataReducer';
import { clearAllPolicies } from '@/reducers/policyReducer';
import { clearAllPopulations } from '@/reducers/populationReducer';
import { clearReport } from '@/reducers/reportReducer';
import { clearAllSimulations } from '@/reducers/simulationsReducer';
import { AppDispatch } from '@/store';

/**
 * Guard component that validates country parameter in the route.
 *
 * Architecture:
 * - URL parameter is the single source of truth for country
 * - This guard validates the country parameter
 * - Components read country directly from URL via useCurrentCountry() hook
 * - Syncs to Redux state for metadata loading and session-scoped state management
 *
 * Flow:
 * 1. Validates countryId from URL parameter
 * 2. If valid, syncs to Redux metadata state
 * 3. Clears all ingredient state for new country (session-scoped behavior)
 *    - Policies, simulations, populations, and reports are all cleared
 *    - This prevents cross-country data contamination
 * 4. If invalid, redirects to root path
 *
 * Acts as a layout component that either redirects or renders child routes.
 */
export function CountryGuard() {
  const { countryId } = useParams<{ countryId: string }>();
  const dispatch = useDispatch<AppDispatch>();

  // Validation logic
  const isValid = countryId && countryIds.includes(countryId as any);

  // Sync country to Redux and clear all ingredient state (session-scoped)
  // This ensures all state is tied to the current country session and prevents
  // cross-country data contamination (e.g., US policy used with UK simulation)
  useEffect(() => {
    if (isValid && countryId) {
      dispatch(setCurrentCountry(countryId));
      // Clear all ingredient state when country changes
      dispatch(clearReport());
      dispatch(clearAllPolicies());
      dispatch(clearAllSimulations());
      dispatch(clearAllPopulations());
    }
  }, [countryId, isValid, dispatch]);

  if (!isValid) {
    // Redirect to root path and let the root route handler determine the country.
    return <Navigate to="/" replace />;
  }

  // Render child routes when validation passes.
  return <Outlet />;
}
