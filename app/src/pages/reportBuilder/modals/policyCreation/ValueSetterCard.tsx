/**
 * ValueSetterCard - Card with mode selector, value inputs, and submit button
 * Uses SegmentedControl for mode selection and V6-styled value selectors
 */

import { Button } from '@/components/ui/button';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Stack } from '@/components/ui/Stack';
import { Text } from '@/components/ui/Text';
import { colors, spacing } from '@/designTokens';
import { ValueSetterMode } from '@/pathways/report/components/valueSetters';
import { FONT_SIZES } from '../../constants';
import { ValueSetterCardProps } from './types';
import { ValueSetterComponentsV6 } from './valueSelectors';

// Map enum values to display labels
const MODE_OPTIONS = [
  { label: 'Default', value: ValueSetterMode.DEFAULT },
  { label: 'Yearly', value: ValueSetterMode.YEARLY },
  { label: 'Date range', value: ValueSetterMode.DATE },
  { label: 'Multi-year', value: ValueSetterMode.MULTI_YEAR },
];

export function ValueSetterCard({
  selectedParam,
  localPolicy,
  minDate,
  maxDate,
  valueSetterMode,
  intervals,
  startDate,
  endDate,
  onModeChange,
  onIntervalsChange,
  onStartDateChange,
  onEndDateChange,
  onSubmit,
}: ValueSetterCardProps) {
  const ValueSetterToRender = ValueSetterComponentsV6[valueSetterMode];

  return (
    <div
      style={{
        background: colors.white,
        borderRadius: spacing.radius.feature,
        padding: spacing.lg,
        border: `1px solid ${colors.border.light}`,
      }}
    >
      <Stack gap="md">
        <Text fw={600} style={{ fontSize: FONT_SIZES.normal, color: colors.gray[700] }}>
          Set new value
        </Text>

        {/* Mode selector - SegmentedControl per V6 mockup */}
        <SegmentedControl
          value={valueSetterMode}
          onValueChange={(value) => {
            onIntervalsChange([]);
            onModeChange(value as ValueSetterMode);
          }}
          size="xs"
          options={MODE_OPTIONS}
        />

        <ValueSetterToRender
          minDate={minDate}
          maxDate={maxDate}
          param={selectedParam}
          policy={localPolicy}
          intervals={intervals}
          setIntervals={onIntervalsChange}
          startDate={startDate}
          setStartDate={onStartDateChange}
          endDate={endDate}
          setEndDate={onEndDateChange}
          onSubmit={onSubmit}
        />

        <Button onClick={onSubmit} disabled={intervals.length === 0} className="tw:w-full">
          Add change
        </Button>
      </Stack>
    </div>
  );
}
