import { ErrorState } from '@/components/flagship/states';
import { Button } from '@/components/ui';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

/**
 * A link to a household report, which the classic calculator ran. This
 * page shows society-wide results only, so it says so rather than run
 * the report, which would score one household and write that over the
 * report's stored outputs.
 */
export default function ReportNotSocietyWide() {
  const nav = useAppNavigate();
  const countryId = useCurrentCountry();
  return (
    <ErrorState
      title="This report cannot open here"
      description="It is a household report. This page shows nationwide and state results only."
      actions={
        <Button variant="outline" onClick={() => nav.push(`/${countryId}/build`)}>
          Back to Build
        </Button>
      }
    />
  );
}
