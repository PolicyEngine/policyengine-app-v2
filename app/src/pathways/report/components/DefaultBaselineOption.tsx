/**
 * DefaultBaselineOption - Option card for selecting default baseline simulation
 *
 * This is a selectable card that renders an option for "Current law + Nationwide population"
 * as a quick-select for the baseline simulation in a report.
 *
 * Unlike other cards, this one doesn't navigate anywhere - it just marks itself as selected
 * and the parent view handles creation when "Next" is clicked.
 */

import { IconChevronRight } from '@tabler/icons-react';
import { Group, Stack, Text } from '@/components/ui';
import { colors, typography } from '@/designTokens';
import { cn } from '@/lib/utils';
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
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'tw:w-full tw:text-left tw:rounded-element tw:border tw:p-md tw:transition-all',
        isSelected
          ? 'tw:border-primary-500 tw:bg-secondary-100 tw:cursor-pointer tw:hover:bg-secondary-200 tw:hover:border-primary-600'
          : 'tw:border-border-light tw:bg-white tw:cursor-pointer tw:hover:bg-gray-50 tw:hover:border-border-medium'
      )}
    >
      <Group className="tw:justify-between tw:items-center">
        <div className="tw:w-5 tw:shrink-0" />
        <Stack gap="xs" style={{ flex: 1 }}>
          <Text fw={typography.fontWeight.bold}>{simulationLabel}</Text>
          <Text size="sm" style={{ color: colors.gray[600] }}>
            Use current law with all households nationwide as baseline
          </Text>
        </Stack>
        <IconChevronRight
          size={20}
          style={{
            color: colors.gray[600],
            marginTop: '2px',
            flexShrink: 0,
          }}
        />
      </Group>
    </button>
  );
}
