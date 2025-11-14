/**
 * HouseholdBuilderView - View for building custom household
 * TO BE FULLY IMPLEMENTED - Placeholder for Phase 3
 *
 * This view will be a props-based version of HouseholdBuilderFrame.
 * Due to its complexity (~650 lines), full implementation is deferred to Phase 4.
 *
 * For Phase 3, this serves as architectural placeholder showing the interface contract.
 */

import { Stack, Text } from '@mantine/core';
import FlowView from '@/components/common/FlowView';
import { PopulationStateProps } from '@/types/pathwayState';

interface HouseholdBuilderViewProps {
  population: PopulationStateProps;
  countryId: string;
  onSubmitSuccess: (householdId: string) => void;
  onReturn: () => void;
}

export default function HouseholdBuilderView({
  population,
  countryId,
  onSubmitSuccess,
  onReturn,
}: HouseholdBuilderViewProps) {
  // TODO Phase 4: Full implementation of household builder
  // This should duplicate all logic from HouseholdBuilderFrame but use props instead of Redux

  const content = (
    <Stack gap="md" align="center" p="xl">
      <Text fw={600} size="lg" c="orange">
        ⚠️ Household Builder View - Phase 4 Implementation
      </Text>
      <Text c="dimmed" ta="center">
        This view will contain the full household building interface. For now, this is an
        architectural placeholder. Full implementation will duplicate HouseholdBuilderFrame's 650+
        lines of logic using props-based state management.
      </Text>
      <Text size="sm" c="dimmed" ta="center">
        Props received: population, countryId={countryId}
      </Text>
    </Stack>
  );

  return (
    <FlowView
      title="Build Your Household (Coming in Phase 4)"
      content={content}
      primaryAction={{
        label: 'Placeholder - Not Implemented',
        onClick: () => alert('Full implementation in Phase 4'),
        isDisabled: true,
      }}
      cancelAction={{
        onClick: onReturn,
      }}
    />
  );
}
