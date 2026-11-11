import { Alert, AlertDescription, AlertTitle, Button, Text } from '@/components/ui';

/** Keep rejected inputs in the builder so users can correct them before retrying. */
export default function HouseholdSaveError({
  error,
  onResetSPM,
}: {
  error: Error | null;
  onResetSPM: () => void;
}) {
  if (!error) {
    return null;
  }
  const code = 'code' in error && typeof error.code === 'string' ? error.code : undefined;
  const recovery =
    code === 'SPM_YEAR_UNAVAILABLE'
      ? 'Return to report setup and select a year supported by the SPM artifact, then save again.'
      : code === 'SPM_GEOGRAPHY_UNAVAILABLE' || code === 'SPM_GEOGRAPHY_REQUIRED'
        ? 'Review the county FIPS code or choose another SPM geography, then save again.'
        : code === 'SPM_COMPOSITION_REQUIRED'
          ? 'Review the household members and required inputs, then save again.'
          : code === 'SPM_SETTINGS_INVALID'
            ? 'Choose SPM settings again to clear the rejected settings, then save again.'
            : 'Your household inputs are still here. Review them and try saving again.';

  return (
    <Alert variant="destructive">
      <AlertTitle>Unable to save household</AlertTitle>
      <AlertDescription>
        <Text size="sm">{error.message}</Text>
        {code && <Text size="sm">Error code: {code}</Text>}
        <Text size="sm">{recovery}</Text>
        {code === 'SPM_SETTINGS_INVALID' && (
          <Button variant="outline" onClick={onResetSPM}>
            Choose SPM settings again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
