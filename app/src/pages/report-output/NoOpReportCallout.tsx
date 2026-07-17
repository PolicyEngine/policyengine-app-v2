import { IconInfoCircle } from '@tabler/icons-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui';
import { colors } from '@/designTokens';

interface NoOpReportCalloutProps {
  /** Simulated year from the report context, or null when unavailable. */
  year: string | null;
}

/**
 * Informational callout shown on the society-wide overview when a reform is a
 * complete no-op — every output is identical to current law. It explains WHY
 * everything reads "No change", instead of leaving the user to wonder whether
 * their reform genuinely costs nothing or never touched anything in effect
 * that year.
 */
export default function NoOpReportCallout({ year }: NoOpReportCalloutProps) {
  const yearLabel = year ?? 'the simulated year';

  return (
    <Alert className="tw:border-primary-500">
      <IconInfoCircle size={20} style={{ color: colors.primary[600] }} />
      <AlertTitle>{`This reform doesn't change any policy in ${yearLabel}`}</AlertTitle>
      <AlertDescription>
        {`Every output is identical to current law. Check that your parameters' start dates cover ${yearLabel}, and that the programs you edited are in effect that year — some credits phase in later or expire.`}
      </AlertDescription>
    </Alert>
  );
}
