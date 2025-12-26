/**
 * Simple Country Guard for Website (no Redux dependency)
 *
 * Validates country parameter in the route without syncing to Redux.
 * Used by WebsiteRouter where Redux is not available.
 */
import { Navigate, Outlet, useParams } from 'react-router-dom';
import { countryIds } from '@policyengine/shared';

export function CountryGuardSimple() {
  const { countryId } = useParams<{ countryId: string }>();

  const isValid = countryId && countryIds.includes(countryId as any);

  if (!isValid) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
