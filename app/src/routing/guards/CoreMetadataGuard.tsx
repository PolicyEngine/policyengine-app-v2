import { useSelector } from 'react-redux';
import { Outlet } from 'react-router-dom';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { selectCoreMetadataState, useFetchCoreMetadata } from '@/hooks/useCoreMetadata';
import ErrorPage from '@/pages/report-output/ErrorPage';
import LoadingPage from '@/pages/report-output/LoadingPage';

/**
 * Guard component that ensures all metadata (variables, datasets, parameters, parameterValues)
 * is loaded before rendering child routes.
 *
 * This is the V2 unified loading approach - loads all metadata in one request.
 *
 * Loading states:
 * 1. loading === true → Shows loading page
 * 2. error !== null → Shows error page
 * 3. loaded === false → Shows loading page
 * 4. loaded === true → Renders child routes
 *
 * Example usage in Router:
 * ```tsx
 * {
 *   element: <CoreMetadataGuard />,
 *   children: [
 *     { path: 'household/*', element: <HouseholdPage /> },
 *   ],
 * }
 * ```
 */
export function CoreMetadataGuard() {
  const countryId = useCurrentCountry();
  useFetchCoreMetadata(countryId);

  const { loading, loaded, error } = useSelector(selectCoreMetadataState);

  if (error) {
    return <ErrorPage error={error} />;
  }

  if (loading || !loaded) {
    return <LoadingPage message="Loading metadata..." />;
  }

  return <Outlet />;
}
