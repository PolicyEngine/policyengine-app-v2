import { Outlet } from 'react-router-dom';
import { useCurrentCountry } from '@policyengine/shared';
import { useFetchMetadata } from '@/hooks/useMetadata';

/**
 * Lazy loader that triggers metadata fetch in the background without blocking.
 *
 * This component fetches metadata but renders child routes immediately, allowing
 * pages to load instantly even while metadata is being fetched. Use this for routes
 * that don't immediately require metadata to render but might need it later (e.g.,
 * HomePage, navigation pages, list pages).
 *
 * Benefits:
 * - Fast initial page loads (no blocking on metadata fetch)
 * - Metadata is prefetched for subsequent navigation
 * - If user navigates to a MetadataGuard route, metadata may already be loaded
 *
 * Child components can check metadata state and show loading indicators if needed:
 * ```tsx
 * const metadata = useSelector((state: RootState) => state.metadata);
 * if (metadata.loading) return <Spinner />;
 * if (!metadata.version) return <EmptyState />;
 * ```
 *
 * Example usage in Router:
 * ```tsx
 * {
 *   element: <MetadataLazyLoader />,
 *   children: [
 *     { index: true, element: <DashboardPage /> },
 *     { path: 'simulations', element: <SimulationsPage /> },
 *   ],
 * }
 * ```
 *
 * Note: useFetchMetadata handles caching, so calling it in multiple guards
 * (MetadataGuard and MetadataLazyLoader) won't cause duplicate fetches.
 */
export function MetadataLazyLoader() {
  const countryId = useCurrentCountry();

  // Trigger metadata fetch but don't wait for it
  useFetchMetadata(countryId);

  // Always render children immediately
  return <Outlet />;
}
