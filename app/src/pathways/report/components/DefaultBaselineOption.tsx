/**
 * DefaultBaselineOption - Option card for selecting default baseline simulation
 *
 * This is a selectable card that renders an option for "Current law + Nationwide population"
 * as a quick-select for the baseline simulation in a report.
 *
 * Unlike other cards, this one doesn't navigate anywhere - it just marks itself as selected
 * and the parent view handles creation when "Next" is clicked.
 */

import { Card, Group, Stack, Text } from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
import { spacing } from '@/designTokens';
import { getDefaultBaselineLabel } from '@/utils/isDefaultBaselineSimulation';

interface DefaultBaselineOptionProps {
  countryId: string;
  isSelected: boolean;
  onClick: () => void;
}

export default function DefaultBaselineOption({
  countryId,
  isSelected,
  onClick,
}: DefaultBaselineOptionProps) {
  const simulationLabel = getDefaultBaselineLabel(countryId);

  return (
    <Card
      withBorder
      component="button"
      onClick={onClick}
      variant={isSelected ? 'buttonPanel--active' : 'buttonPanel--inactive'}
      style={{
        cursor: 'pointer',
      }}
    >
      <Group justify="space-between" align="center">
        <Stack gap={spacing.xs} style={{ flex: 1 }}>
          <Text fw={700}>{simulationLabel}</Text>
          <Text size="sm" c="dimmed">
            Use current law with all households nationwide as baseline
          </Text>
        </Stack>
        <IconChevronRight
          size={20}
          style={{
            color: 'var(--mantine-color-gray-6)',
            marginTop: '2px',
            flexShrink: 0,
          }}
        />
      </Group>
    </Card>
  );
}
