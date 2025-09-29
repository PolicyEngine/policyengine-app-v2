import { Navigate, Outlet, useParams } from 'react-router-dom';
import { countryIds } from '@/libs/countries';

/**
 * Guard component that validates country parameter in the route.
 * Acts as a layout component that either redirects or renders child routes.
 */
export function CountryGuard() {
  const { countryId } = useParams<{ countryId: string }>();

  // Validation logic
  const isValid = countryId && countryIds.includes(countryId as any);

  if (!isValid) {
    // Redirect to root path and let the root route handler determine the country.
    return <Navigate to="/" replace />;
  }

  // Render child routes when validation passes.
  return <Outlet />;
}
