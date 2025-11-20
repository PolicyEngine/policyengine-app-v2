import { Navigate, Outlet, useParams } from 'react-router-dom';
import { apps } from '@/data/apps/appTransformers';

/**
 * Guard component that verifies the app's country matches the route's country.
 * Redirects to the correct country if mismatch, or to root if app not found.
 */
export function CountryAppGuard() {
  const { countryId, slug } = useParams<{ countryId: string; slug: string }>();

  const app = apps.find((a) => a.slug === slug);

  // If app doesn't exist, let AppPage handle the 404
  if (!app) {
    return <Outlet />;
  }

  // If country doesn't match, redirect to correct country
  if (app.countryId !== countryId) {
    return <Navigate to={`/${app.countryId}/${slug}`} replace />;
  }

  return <Outlet />;
}
