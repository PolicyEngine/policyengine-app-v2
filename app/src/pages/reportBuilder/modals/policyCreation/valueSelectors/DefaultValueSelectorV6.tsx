/**
 * DefaultValueSelectorV6 - V6 styled default value selector
 * Logic copied from original, only layout/styling changed to match V6 mockup
 */

import { useEffect, useState } from 'react';
import { Group, Stack, Text, YearPicker } from '@/components/ui';
import { FOREVER } from '@/constants';
import { colors } from '@/designTokens';
import { getDefaultValueForParam } from '@/pathways/report/components/valueSetters/getDefaultValueForParam';
import { ValueInputBox } from '@/pathways/report/components/valueSetters/ValueInputBox';
import { ValueSetterProps } from '@/pathways/report/components/valueSetters/ValueSetterProps';
import { ValueInterval } from '@/types/subIngredients/valueInterval';
import { fromISODateString, toISODateString } from '@/utils/dateUtils';

export function DefaultValueSelectorV6(props: ValueSetterProps) {
  const {
    param,
    policy,
    setIntervals,
    minDate,
    maxDate,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
  } = props;

  // Local state for param value
  const [paramValue, setParamValue] = useState<any>(
    getDefaultValueForParam(param, policy, startDate)
  );

  // Set endDate to 2100-12-31 for default mode
  useEffect(() => {
    setEndDate(FOREVER);
  }, [setEndDate]);

  // Update param value when startDate changes
  useEffect(() => {
    if (startDate) {
      const newValue = getDefaultValueForParam(param, policy, startDate);
      setParamValue(newValue);
    }
  }, [startDate, param, policy]);

  // Update intervals whenever local state changes
  useEffect(() => {
    if (startDate && endDate) {
      const newInterval: ValueInterval = {
        startDate,
        endDate,
        value: paramValue,
      };
      setIntervals([newInterval]);
    } else {
      setIntervals([]);
    }
  }, [startDate, endDate, paramValue, setIntervals]);

  function handleStartDateChange(value: Date | null) {
    setStartDate(toISODateString(value));
  }

  // V6 Layout: Two rows - date row, then value row
  return (
    <Stack gap="sm">
      {/* First row: From year + "onward" */}
      <Group gap="sm" align="end">
        <div style={{ flex: 1 }}>
          <Text size="xs" c={colors.gray[600]} style={{ marginBottom: 4 }}>
            From
          </Text>
          <YearPicker
            placeholder="2025"
            minDate={fromISODateString(minDate)}
            maxDate={fromISODateString(maxDate)}
            value={fromISODateString(startDate)}
            onChange={handleStartDateChange}
          />
        </div>
        <Text size="sm" c={colors.gray[800]} style={{ paddingBottom: 8 }}>
          onward
        </Text>
      </Group>

      {/* Second row: Value */}
      <div>
        <Text size="xs" c={colors.gray[600]} style={{ marginBottom: 4 }}>
          Value
        </Text>
        <ValueInputBox
          param={param}
          value={paramValue}
          onChange={setParamValue}
          onSubmit={props.onSubmit}
        />
      </div>
    </Stack>
  );
}
