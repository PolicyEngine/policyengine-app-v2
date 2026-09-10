import { Stack, Text } from '@/components/ui';
import type { HouseholdCalculationOutput } from '@/types/calculation/household';

/** Display calculation receipts in the results, without claiming certification. */
export default function SPMMethodologyFootnote({
  output,
  context = 'point',
}: {
  output: (HouseholdCalculationOutput | null)[];
  context?: 'point' | 'variation';
}) {
  const receipts = output
    .map((item, index) => ({ item, label: index === 0 ? 'Baseline' : 'Reform' }))
    .filter(({ item }) => item?.spmProvenance);
  if (!receipts.length) {
    return null;
  }
  return (
    <Stack
      role="region"
      aria-label={`SPM ${context === 'point' ? 'point calculation' : 'variation'} methodology`}
      gap="sm"
      className="tw:mt-lg tw:border-t tw:border-border tw:pt-md"
    >
      <Text size="sm">Supplemental Poverty Measure methodology</Text>
      {receipts.map(({ item, label }) => (
        <details key={label}>
          <summary className="tw:text-sm tw:cursor-pointer">
            {label}
            {' · '}
            {context === 'point' ? 'Point calculation' : 'Earnings variation'}
            {' · '}
            {item!.spmProvenance!.geography_kind === 'national'
              ? 'National thresholds'
              : 'Local thresholds'}
            {' · '}
            {item!.spmProvenance!.scenario}
          </summary>
          <Text size="sm">Forecast: {item!.spmProvenance!.forecast_id}</Text>
          <pre className="tw:overflow-auto tw:whitespace-pre-wrap tw:break-all tw:text-xs">
            {JSON.stringify(
              { spm_config: item!.spmConfig, spm_provenance: item!.spmProvenance },
              null,
              2
            )}
          </pre>
        </details>
      ))}
    </Stack>
  );
}
