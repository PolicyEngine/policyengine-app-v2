/**
 * Simple Country Guard for Website (no Redux dependency)
 *
 * Validates country parameter in the route without syncing to Redux.
 * Used by WebsiteRouter where Redux is not available.
 * Provides CountryContext, NavigationContext, and LocationContext so
 * shared components using the router abstraction layer work correctly.
 */
import { useCallback, useMemo } from 'react';
import { Navigate, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { CountryProvider } from '@/contexts/CountryContext';
import { LocationProvider } from '@/contexts/LocationContext';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { countryIds, type CountryId } from '@/libs/countries';

export function CountryGuardSimple() {
  const { countryId } = useParams<{ countryId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const isValid = countryId && countryIds.includes(countryId as any);

  const push = useCallback((path: string) => navigate(path), [navigate]);
  const replace = useCallback((path: string) => navigate(path, { replace: true }), [navigate]);
  const back = useCallback(() => navigate(-1), [navigate]);
  const navValue = useMemo(() => ({ push, replace, back }), [push, replace, back]);

  const locationValue = useMemo(
    () => ({ pathname: location.pathname, search: location.search }),
    [location.pathname, location.search]
  );

  if (!isValid) {
    return <Navigate to="/" replace />;
  }

  return (
    <CountryProvider value={countryId as CountryId}>
      <NavigationProvider value={navValue}>
        <LocationProvider value={locationValue}>
          <Outlet />
        </LocationProvider>
      </NavigationProvider>
    </CountryProvider>
  );
}
