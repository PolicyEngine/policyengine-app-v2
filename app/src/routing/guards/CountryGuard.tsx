import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { Navigate, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { CountryProvider } from '@/contexts/CountryContext';
import { LocationProvider } from '@/contexts/LocationContext';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { countryIds, type CountryId } from '@/libs/countries';
import { setCurrentCountry } from '@/reducers/metadataReducer';
import { AppDispatch } from '@/store';

/**
 * Guard component that validates country parameter in the route.
 *
 * Reads countryId from react-router's useParams and provides it via
 * CountryProvider so that useCurrentCountry() works without any
 * direct react-router dependency. Also provides NavigationContext and
 * LocationContext so shared components work in both router contexts.
 */
export function CountryGuard() {
  const { countryId } = useParams<{ countryId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();

  const isValid = countryId && countryIds.includes(countryId as any);

  useEffect(() => {
    if (isValid && countryId) {
      dispatch(setCurrentCountry(countryId));
    }
  }, [countryId, isValid, dispatch]);

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
