import { useEffect, useState } from 'react';
import { Box, Group, Text } from '@mantine/core';
import { YearPickerInput } from '@mantine/dates';
import { FOREVER } from '@/constants';
import { ValueInterval } from '@/types/subIngredients/valueInterval';
import { fromISODateString, toISODateString } from '@/utils/dateUtils';
import { getDefaultValueForParam } from './getDefaultValueForParam';
import { ValueInputBox } from './ValueInputBox';
import { ValueSetterProps } from './ValueSetterProps';

export function DefaultValueSelector(props: ValueSetterProps) {
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

  function handleStartDateChange(value: Date | string | null) {
    setStartDate(toISODateString(value));
  }

  return (
    <Group align="flex-end" style={{ flex: 1 }}>
      <YearPickerInput
        placeholder="Pick a year"
        label="From"
        minDate={fromISODateString(minDate)}
        maxDate={fromISODateString(maxDate)}
        value={fromISODateString(startDate)}
        onChange={handleStartDateChange}
        style={{ flex: 1 }}
      />
      <Box style={{ flex: 1, display: 'flex', alignItems: 'center', height: '36px' }}>
        <Text size="sm" fw={500}>
          onward:
        </Text>
      </Box>
      <Box style={{ flex: 1 }}>
        <ValueInputBox param={param} value={paramValue} onChange={setParamValue} />
      </Box>
    </Group>
  );
}
