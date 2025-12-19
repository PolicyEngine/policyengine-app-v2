import { useSelector } from 'react-redux';
import { Outlet } from 'react-router-dom';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { selectCoreMetadataState, useFetchCoreMetadata } from '@/hooks/useCoreMetadata';
import ErrorPage from '@/pages/report-output/ErrorPage';
import LoadingPage from '@/pages/report-output/LoadingPage';

/**
 * Guard component that ensures core metadata (variables + datasets) is loaded
 * before rendering child routes.
 *
 * This is the V2 tiered loading approach - only loads essential data immediately.
 * For routes that also need parameters, wrap with ParametersGuard.
 *
 * Loading states:
 * 1. coreLoading === true → Shows loading page
 * 2. coreError !== null → Shows error page
 * 3. coreLoaded === false → Shows loading page
 * 4. coreLoaded === true → Renders child routes
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

  const { coreLoading, coreLoaded, coreError } = useSelector(selectCoreMetadataState);

  if (coreError) {
    return <ErrorPage error={coreError} />;
  }

  if (coreLoading || !coreLoaded) {
    return <LoadingPage message="Loading metadata..." />;
  }

  return <Outlet />;
}
