import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { Group } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { ValueInterval } from '@/types/subIngredients/valueInterval';
import { fromISODateString, toISODateString } from '@/utils/dateUtils';
import { getDefaultValueForParam } from './getDefaultValueForParam';
import { ValueInputBox } from './ValueInputBox';
import { ValueSetterProps } from './ValueSetterProps';

export function DateValueSelector(props: ValueSetterProps) {
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
    baselineValues,
  } = props;

  // Local state for param value
  const [paramValue, setParamValue] = useState<any>(
    getDefaultValueForParam(param, policy, startDate, baselineValues)
  );

  // Set endDate to end of year of startDate
  useEffect(() => {
    if (startDate) {
      const endOfYearDate = dayjs(startDate).endOf('year').format('YYYY-MM-DD');
      setEndDate(endOfYearDate);
    }
  }, [startDate, setEndDate]);

  // Update param value when startDate or baselineValues changes
  useEffect(() => {
    if (startDate) {
      const newValue = getDefaultValueForParam(param, policy, startDate, baselineValues);
      setParamValue(newValue);
    }
  }, [startDate, param, policy, baselineValues]);

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
    setEndDate(toISODateString(value));
  }

  return (
    <Group align="flex-end" style={{ flex: 1 }}>
      <DatePickerInput
        placeholder="Pick a start date"
        label="From"
        minDate={fromISODateString(minDate)}
        maxDate={fromISODateString(maxDate)}
        value={fromISODateString(startDate)}
        onChange={handleStartDateChange}
        style={{ flex: 1 }}
      />
      <DatePickerInput
        placeholder="Pick an end date"
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
