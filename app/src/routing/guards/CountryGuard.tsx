import { Navigate, useLocation, useParams } from 'react-router-dom';
import { countryIds } from '@/libs/countries';

interface CountryGuardProps {
  children: React.ReactNode;
}

/**
 * Guard component that validates country parameter in the route.
 * Wraps the Layout component and redirects if country is invalid.
 */
export function CountryGuard({ children }: CountryGuardProps) {
  const { countryId } = useParams<{ countryId: string }>();
  const location = useLocation();

  // Validation logic
  const isValid = countryId && countryIds.includes(countryId as any);

  if (!isValid) {
    // Extract path after country segment to preserve user's intended destination.
    // We can't use useParams for this - it only gives us { countryId }, not the rest.
    // Route pattern /:countryId doesn't capture /policies/123 part.
    // Using /:countryId/* would capture it but breaks child route matching.
    // So we must use string manipulation on location.pathname.
    const currentPath = location.pathname;
    const pathAfterCountry = countryId
      ? currentPath.substring(countryId.length + 1) // Skip "/{country}"
      : currentPath;
    const defaultCountry = 'us';
    const redirectPath = `/${defaultCountry}${pathAfterCountry}`;

    return <Navigate to={redirectPath} replace />;
  }

  // Render children (Layout) when validation passes.
  // Using {children} instead of <Outlet /> keeps this a simple wrapper component.
  return <>{children}</>;
}
