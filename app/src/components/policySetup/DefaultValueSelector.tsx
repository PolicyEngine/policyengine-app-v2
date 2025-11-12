import { useEffect, useState } from 'react';
import { Box, Group, Text } from '@mantine/core';
import { YearPickerInput } from '@mantine/dates';
import { FOREVER } from '@/constants';
import { fromISODateString } from '@/utils/dateUtils';
import { ValueSetterProps } from './types';
import {
  createDateChangeHandler,
  createSingleValueInterval,
  getDefaultValueForParam,
} from './utils';
import { ValueInputBox } from './ValueInputBox';

export function DefaultValueSelector(props: ValueSetterProps) {
  const {
    param,
    currentParameters,
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
    getDefaultValueForParam(param, currentParameters, startDate)
  );

  // Set endDate to FOREVER for default mode
  useEffect(() => {
    setEndDate(FOREVER);
  }, [setEndDate]);

  // Update param value when startDate changes
  useEffect(() => {
    if (startDate) {
      const newValue = getDefaultValueForParam(param, currentParameters, startDate);
      setParamValue(newValue);
    }
  }, [startDate, param, currentParameters]);

  // Update intervals whenever local state changes
  useEffect(() => {
    const interval = createSingleValueInterval(startDate, endDate, paramValue);
    setIntervals(interval ? [interval] : []);
  }, [startDate, endDate, paramValue, setIntervals]);

  const handleStartDateChange = createDateChangeHandler(setStartDate);

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
