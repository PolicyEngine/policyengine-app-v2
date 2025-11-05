import { Navigate, Outlet, useParams } from 'react-router-dom';

/**
 * Guard component that only allows access for US country routes.
 * Redirects to root for any other country.
 */
export function USOnlyGuard() {
  const { countryId } = useParams<{ countryId: string }>();

  if (countryId !== 'us') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
