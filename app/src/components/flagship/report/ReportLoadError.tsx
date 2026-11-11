import { ErrorState } from '@/components/flagship/states';
import { Button } from '@/components/ui';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

/**
 * A report that could not be opened: the link names no report, or the
 * report (or what it ran on) failed to load. A missing report has
 * nothing to retry, so it points to where reports are found; a failed
 * load asks again.
 */
export default function ReportLoadError({
  notFound,
  onRetry,
}: {
  notFound: boolean;
  onRetry: () => unknown;
}) {
  const nav = useAppNavigate();
  const countryId = useCurrentCountry();
  const backToBuild = (
    <Button variant="outline" onClick={() => nav.push(`/${countryId}/build`)}>
      Back to Build
    </Button>
  );

  if (notFound) {
    return (
      <ErrorState
        title="Report not found"
        description="Check the link, or find the report under your reforms."
        actions={
          <>
            <Button onClick={() => nav.push(`/${countryId}/reforms?filter=yours`)}>
              Your reforms
            </Button>
            {backToBuild}
          </>
        }
      />
    );
  }
  return <ErrorState title="Could not load the report" onRetry={onRetry} actions={backToBuild} />;
}
