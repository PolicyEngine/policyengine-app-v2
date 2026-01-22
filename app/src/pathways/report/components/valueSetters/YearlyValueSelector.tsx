import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { Group } from '@mantine/core';
import { YearPickerInput } from '@mantine/dates';
import { ValueInterval } from '@/types/subIngredients/valueInterval';
import { fromLocalDateString, toLocalDateString } from '@/utils/dateUtils';
import { getDefaultValueForParam } from './getDefaultValueForParam';
import { ValueInputBox } from './ValueInputBox';
import { ValueSetterProps } from './ValueSetterProps';

export function YearlyValueSelector(props: ValueSetterProps) {
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
    const isoString = toLocalDateString(value);
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
        minDate={fromLocalDateString(minDate)}
        maxDate={fromLocalDateString(maxDate)}
        value={fromLocalDateString(startDate)}
        onChange={handleStartDateChange}
        style={{ flex: 1 }}
      />
      <YearPickerInput
        placeholder="Pick a year"
        label="To"
        minDate={fromLocalDateString(minDate)}
        maxDate={fromLocalDateString(maxDate)}
        value={fromLocalDateString(endDate)}
        onChange={handleEndDateChange}
        style={{ flex: 1 }}
      />
      <ValueInputBox param={param} value={paramValue} onChange={setParamValue} />
    </Group>
  );
}
