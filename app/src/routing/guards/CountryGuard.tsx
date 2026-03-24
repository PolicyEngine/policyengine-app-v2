import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Navigate, Outlet, useParams } from 'react-router-dom';
import { CountryProvider } from '@/contexts/CountryContext';
import { countryIds, type CountryId } from '@/libs/countries';
import { setCurrentCountry } from '@/reducers/metadataReducer';
import { AppDispatch } from '@/store';

/**
 * Guard component that validates country parameter in the route.
 *
 * Reads countryId from react-router's useParams and provides it via
 * CountryProvider so that useCurrentCountry() works without any
 * direct react-router dependency.
 */
export function CountryGuard() {
  const { countryId } = useParams<{ countryId: string }>();
  const dispatch = useDispatch<AppDispatch>();

  const isValid = countryId && countryIds.includes(countryId as any);

  useEffect(() => {
    if (isValid && countryId) {
      dispatch(setCurrentCountry(countryId));
    }
  }, [countryId, isValid, dispatch]);

  if (!isValid) {
    return <Navigate to="/" replace />;
  }

  return (
    <CountryProvider value={countryId as CountryId}>
      <Outlet />
    </CountryProvider>
  );
}
