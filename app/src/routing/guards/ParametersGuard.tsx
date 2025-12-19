import { useSelector } from 'react-redux';
import { Outlet } from 'react-router-dom';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { selectParametersState, useFetchParameters } from '@/hooks/useParameters';
import ErrorPage from '@/pages/report-output/ErrorPage';
import LoadingPage from '@/pages/report-output/LoadingPage';

/**
 * Guard component that ensures parameters are loaded before rendering child routes.
 *
 * This is Tier 2 of the V2 tiered loading approach - only used on routes that
 * need policy parameters (e.g., policy editing pages, report pages).
 *
 * Prerequisites:
 * - Must be nested inside CoreMetadataGuard (core metadata must be loaded first)
 *
 * Loading states:
 * 1. parametersLoading === true → Shows loading page
 * 2. parametersError !== null → Shows error page
 * 3. parametersLoaded === false → Shows loading page
 * 4. parametersLoaded === true → Renders child routes
 *
 * Example usage in Router:
 * ```tsx
 * {
 *   element: <CoreMetadataGuard />,
 *   children: [
 *     {
 *       element: <ParametersGuard />,
 *       children: [
 *         { path: 'policy/*', element: <PolicyPage /> },
 *       ],
 *     },
 *   ],
 * }
 * ```
 */
export function ParametersGuard() {
  const countryId = useCurrentCountry();
  useFetchParameters(countryId);

  const { parametersLoading, parametersLoaded, parametersError } =
    useSelector(selectParametersState);

  if (parametersError) {
    return <ErrorPage error={parametersError} />;
  }

  if (parametersLoading || !parametersLoaded) {
    return <LoadingPage message="Loading policy parameters..." />;
  }

  return <Outlet />;
}
