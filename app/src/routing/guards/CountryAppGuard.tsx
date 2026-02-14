import { Navigate, Outlet, useParams } from 'react-router-dom';
import { apps } from '@/data/apps/appTransformers';

/**
 * Guard component that verifies the app's country matches the route's country.
 * Redirects to the correct country if mismatch, or to root if app not found.
 */
export function CountryAppGuard() {
  const { countryId, slug } = useParams<{ countryId: string; slug: string }>();

  // Match by slug+countryId first, then fall back to slug-only
  const app = apps.find((a) => a.slug === slug && a.countryId === countryId);

  if (!app) {
    // Try to find any app with this slug and redirect to its country
    const fallback = apps.find((a) => a.slug === slug);
    if (!fallback) {
      return <Outlet />;
    }
    return <Navigate to={`/${fallback.countryId}/${slug}`} replace />;
  }

  return <Outlet />;
}
