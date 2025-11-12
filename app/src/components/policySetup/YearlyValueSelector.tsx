import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { Group } from '@mantine/core';
import { YearPickerInput } from '@mantine/dates';
import { fromISODateString, toISODateString } from '@/utils/dateUtils';
import { ValueInterval } from '@/types/subIngredients/valueInterval';
import { ValueSetterProps } from './types';
import { getDefaultValueForParam } from './utils';
import { ValueInputBox } from './ValueInputBox';

export function YearlyValueSelector(props: ValueSetterProps) {
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
      const newValue = getDefaultValueForParam(param, currentParameters, startDate);
      setParamValue(newValue);
    }
  }, [startDate, param, currentParameters]);

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

  function handleEndDateChange(value: Date | string | null) {
    const isoString = toISODateString(value);
    if (isoString) {
      const endOfYearDate = dayjs(isoString).endOf('year').format('YYYY-MM-DD');
      setEndDate(endOfYearDate);
    } else {
      setEndDate('');
    }
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
      <YearPickerInput
        placeholder="Pick a year"
        label="To"
        minDate={fromISODateString(minDate)}
        maxDate={fromISODateString(maxDate)}
        value={fromISODateString(endDate)}
        onChange={handleEndDateChange}
        style={{ flex: 1 }}
      />
      <ValueInputBox param={param} value={paramValue} onChange={setParamValue} />
    </Group>
  );
}
