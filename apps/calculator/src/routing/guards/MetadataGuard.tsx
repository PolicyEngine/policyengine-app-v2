import { useSelector } from 'react-redux';
import { Outlet } from 'react-router-dom';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useFetchMetadata } from '@/hooks/useMetadata';
import ErrorPage from '@/pages/report-output/ErrorPage';
import LoadingPage from '@/pages/report-output/LoadingPage';
import { RootState } from '@/store';

/**
 * Guard component that ensures metadata is loaded before rendering child routes.
 *
 * This guard BLOCKS rendering until metadata is fully loaded, showing a loading
 * page while fetching. Use this for routes that absolutely require metadata to
 * render properly (e.g., ReportOutputPage, HouseholdOverview).
 *
 * The guard checks:
 * 1. If metadata is currently loading - shows loading page
 * 2. If metadata fetch failed - shows error page
 * 3. If metadata.version is missing - shows loading page
 * 4. Otherwise - renders child routes via <Outlet />
 *
 * Note: useFetchMetadata is smart and won't re-fetch if metadata already exists
 * for the current country, so navigation between guarded routes is instant once
 * metadata is cached.
 *
 * Example usage in Router:
 * ```tsx
 * {
 *   element: <MetadataGuard />,
 *   children: [
 *     { path: 'report-output/:reportId', element: <ReportOutputPage /> },
 *   ],
 * }
 * ```
 */
export function MetadataGuard() {
  const countryId = useCurrentCountry();
  useFetchMetadata(countryId);

  const metadata = useSelector((state: RootState) => state.metadata);

  // Show loading page while metadata is being fetched
  if (metadata.loading) {
    return <LoadingPage message="Loading metadata..." />;
  }

  // Show error page if fetch failed
  if (metadata.error) {
    return <ErrorPage error={metadata.error} />;
  }

  // If metadata.version is null/undefined, metadata hasn't loaded yet
  // This handles the case where loading is false but fetch hasn't started
  if (!metadata.version) {
    return <LoadingPage message="Loading metadata..." />;
  }

  // Metadata is loaded and ready - render child routes
  return <Outlet />;
}
