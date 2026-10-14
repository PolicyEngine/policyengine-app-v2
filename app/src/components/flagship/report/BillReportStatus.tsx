import ReportSkeleton from '@/components/flagship/report/ReportSkeleton';
import { EmptyState, ErrorState } from '@/components/flagship/states';
import { Button } from '@/components/ui';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

/**
 * A bill's report before there is a bill to show: the feed still
 * loading, the feed failed or not configured, or a bill the feed does
 * not carry. Only a failed feed is worth asking again.
 */
export default function BillReportStatus({
  isLoading,
  isError,
  isConfigured,
  onRetry,
}: {
  isLoading: boolean;
  isError: boolean;
  isConfigured: boolean;
  onRetry: () => unknown;
}) {
  const nav = useAppNavigate();
  const countryId = useCurrentCountry();

  if (isLoading) {
    return <ReportSkeleton label="Loading the bill" />;
  }

  const toBills = () => nav.push(`/${countryId}/reforms`);

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      {isError ? (
        <ErrorState
          title="Could not load the bill feed"
          onRetry={onRetry}
          actions={
            <Button variant="outline" onClick={toBills}>
              All bills
            </Button>
          }
        />
      ) : isConfigured ? (
        <EmptyState
          title="This bill is not in the feed."
          action={
            <Button size="sm" onClick={toBills}>
              All bills
            </Button>
          }
        />
      ) : (
        // Without a feed there are no bills to go back to; a reform can still be built.
        <EmptyState
          title="The bill feed is not configured here."
          action={
            <Button size="sm" onClick={() => nav.push(`/${countryId}/build`)}>
              Build a reform
            </Button>
          }
        />
      )}
    </div>
  );
}
