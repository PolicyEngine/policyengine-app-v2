import { ErrorState } from '@/components/flagship/states';
import { Spinner } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { useFlagshipMetadataStatus } from '@/hooks/useFlagshipMetadataStatus';
import { V3_API_ROUTES } from '@/libs/flagship/v3ApiRoutes';

/**
 * On the v2 routes, a v3 page waits for the small model catalog (the
 * version, regions, years and entities it is built on) behind a short
 * loading page, the only one: everything else it shows waits in its own
 * skeletons. A failure says so and asks again. On the v1 routes the page
 * shows at once, as before, with its skeletons standing for the whole
 * metadata.
 */
function V2ModelCatalogGate({ children }: { children: React.ReactNode }) {
  const metadata = useFlagshipMetadataStatus();
  if (metadata.status === 'error') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: spacing['3xl'] }}>
        <ErrorState title="Could not load the model" onRetry={metadata.retry} />
      </div>
    );
  }
  if (metadata.status === 'loading') {
    return (
      <div
        role="status"
        aria-label="Loading the model"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          minHeight: '50vh',
          fontSize: typography.fontSize.sm,
          color: colors.text.secondary,
        }}
      >
        <Spinner size="sm" />
      </div>
    );
  }
  return <>{children}</>;
}

function V1ModelCatalogGate({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export default V3_API_ROUTES === 'v2' ? V2ModelCatalogGate : V1ModelCatalogGate;
