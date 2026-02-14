import { Navigate, Outlet, useParams } from 'react-router-dom';
import { apps } from '@/data/apps/appTransformers';

/**
 * Guard component that verifies the app's country matches the route's country.
 * Redirects to the correct country if mismatch, or to root if app not found.
 */
export function CountryAppGuard() {
  const { countryId, slug } = useParams<{ countryId: string; slug: string }>();

  // Match by slug + countryId (some apps share a slug across countries)
  const app = apps.find((a) => a.slug === slug && a.countryId === countryId);

  // If no match for this country, try any country and redirect
  if (!app) {
    const fallback = apps.find((a) => a.slug === slug);
    if (!fallback) {
      return <Outlet />;
    }
    return <Navigate to={`/${fallback.countryId}/${slug}`} replace />;
  }

  return <Outlet />;
}
