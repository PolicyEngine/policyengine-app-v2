/**
 * DateValueSelectorV6 - V6 styled date range value selector
 * Logic copied from original, only layout/styling changed to match V6 mockup
 */

import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { Box, Group, Stack, Text } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { colors, spacing } from '@/designTokens';
import { getDefaultValueForParam } from '@/pathways/report/components/valueSetters/getDefaultValueForParam';
import { ValueInputBox } from '@/pathways/report/components/valueSetters/ValueInputBox';
import { ValueSetterProps } from '@/pathways/report/components/valueSetters/ValueSetterProps';
import { ValueInterval } from '@/types/subIngredients/valueInterval';
import { fromLocalDateString, toLocalDateString } from '@/utils/dateUtils';

export function DateValueSelectorV6(props: ValueSetterProps) {
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

  function handleStartDateChange(value: Date | string | null) {
    setStartDate(toLocalDateString(value));
  }

  function handleEndDateChange(value: Date | string | null) {
    setEndDate(toLocalDateString(value));
  }

  // V6 Layout: Two rows - date row, then value row
  return (
    <Stack gap={spacing.sm}>
      {/* First row: From date + To date */}
      <Group gap={spacing.sm}>
        <Box style={{ flex: 1 }}>
          <Text size="xs" c={colors.gray[600]} mb={4}>
            From
          </Text>
          <DatePickerInput
            placeholder="From"
            minDate={fromLocalDateString(minDate)}
            maxDate={fromLocalDateString(maxDate)}
            value={fromLocalDateString(startDate)}
            onChange={handleStartDateChange}
            valueFormat="MMM. D, YYYY"
          />
        </Box>
        <Box style={{ flex: 1 }}>
          <Text size="xs" c={colors.gray[600]} mb={4}>
            To
          </Text>
          <DatePickerInput
            placeholder="To"
            minDate={fromLocalDateString(minDate)}
            maxDate={fromLocalDateString(maxDate)}
            value={fromLocalDateString(endDate)}
            onChange={handleEndDateChange}
            valueFormat="MMM. D, YYYY"
          />
        </Box>
      </Group>

      {/* Second row: Value */}
      <Box>
        <Text size="xs" c={colors.gray[600]} mb={4}>
          Value
        </Text>
        <ValueInputBox
          param={param}
          value={paramValue}
          onChange={setParamValue}
          onSubmit={props.onSubmit}
        />
      </Box>
    </Stack>
  );
}
