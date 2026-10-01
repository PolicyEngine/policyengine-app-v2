import SPMProvenanceDetails from '@/components/report/SPMProvenanceDetails';
import { Stack, Text } from '@/components/ui';
import type { SPMComparisonProvenance } from '@/types/spm';

/** Display the baseline and reform receipts attached to a society-wide result. */
export default function SPMComparisonMethodology({
  provenance,
}: {
  provenance: SPMComparisonProvenance;
}) {
  return (
    <Stack
      role="region"
      aria-label="SPM society-wide methodology"
      gap="md"
      className="tw:mt-lg tw:border-t tw:border-border tw:pt-md"
    >
      <Text size="sm">Supplemental Poverty Measure methodology</Text>
      <SPMProvenanceDetails
        label="Baseline"
        receipt={provenance.baseline.receipt}
        executionCount={provenance.baseline.execution_count}
      />
      <SPMProvenanceDetails
        label="Reform"
        receipt={provenance.reform.receipt}
        executionCount={provenance.reform.execution_count}
      />
    </Stack>
  );
}
