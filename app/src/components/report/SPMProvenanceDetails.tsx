import { Stack, Text } from '@/components/ui';
import { buildSPMProvenanceDisplayRows, type SPMProvenance } from '@/types/spm';

interface SPMProvenanceDetailsProps {
  label: string;
  receipt: SPMProvenance;
  executionCount?: number;
}

/** Render the compact public receipt without exposing internal diagnostic data. */
export default function SPMProvenanceDetails({
  label,
  receipt,
  executionCount,
}: SPMProvenanceDetailsProps) {
  const rows = buildSPMProvenanceDisplayRows(receipt);
  return (
    <Stack role="region" aria-label={`${label} SPM provenance`} gap="xs">
      <Text size="sm">{label}</Text>
      {executionCount !== undefined && (
        <Text size="sm">Executions: {executionCount.toLocaleString()}</Text>
      )}
      <dl className="tw:grid tw:grid-cols-[max-content_1fr] tw:gap-x-md tw:gap-y-xs tw:text-sm">
        {rows.map((row) => (
          <div key={row.label} className="tw:contents">
            <dt className="tw:font-medium">{row.label}</dt>
            <dd className="tw:break-all">{row.value}</dd>
          </div>
        ))}
      </dl>
    </Stack>
  );
}
