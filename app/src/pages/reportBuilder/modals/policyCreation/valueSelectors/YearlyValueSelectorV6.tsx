/**
 * YearlyValueSelectorV6 - V6 styled yearly value selector
 * Logic copied from original, only layout/styling changed to match V6 mockup
 */

import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { Group, Stack, Text, YearPicker } from '@/components/ui';
import { colors } from '@/designTokens';
import { getDefaultValueForParam } from '@/pathways/report/components/valueSetters/getDefaultValueForParam';
import { ValueInputBox } from '@/pathways/report/components/valueSetters/ValueInputBox';
import { ValueSetterProps } from '@/pathways/report/components/valueSetters/ValueSetterProps';
import { ValueInterval } from '@/types/subIngredients/valueInterval';
import { fromLocalDateString, toLocalDateString } from '@/utils/dateUtils';

export function YearlyValueSelectorV6(props: ValueSetterProps) {
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

  // Set endDate to end of year of startDate
  useEffect(() => {
    if (startDate) {
      const endOfYearDate = dayjs(startDate).endOf('year').format('YYYY-MM-DD');
      setEndDate(endOfYearDate);
    }
  }, [startDate, setEndDate]);

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
    setStartDate(toLocalDateString(value));
  }

  function handleEndDateChange(value: Date | null) {
    const dateString = toLocalDateString(value);
    if (dateString) {
      const endOfYearDate = dayjs(dateString).endOf('year').format('YYYY-MM-DD');
      setEndDate(endOfYearDate);
    } else {
      setEndDate('');
    }
  }

  // V6 Layout: Two rows - date row, then value row
  return (
    <Stack gap="sm">
      {/* First row: From year + To year */}
      <Group gap="sm">
        <div style={{ flex: 1 }}>
          <Text size="xs" c={colors.gray[600]} style={{ marginBottom: 4 }}>
            From
          </Text>
          <YearPicker
            placeholder="2025"
            minDate={fromLocalDateString(minDate)}
            maxDate={fromLocalDateString(maxDate)}
            value={fromLocalDateString(startDate)}
            onChange={handleStartDateChange}
          />
        </div>
        <div style={{ flex: 1 }}>
          <Text size="xs" c={colors.gray[600]} style={{ marginBottom: 4 }}>
            To
          </Text>
          <YearPicker
            placeholder="2026"
            minDate={fromLocalDateString(minDate)}
            maxDate={fromLocalDateString(maxDate)}
            value={fromLocalDateString(endDate)}
            onChange={handleEndDateChange}
          />
        </div>
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
