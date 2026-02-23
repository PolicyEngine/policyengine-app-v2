import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { DatePickerInput } from '@mantine/dates';
import { ValueInterval } from '@/types/subIngredients/valueInterval';
import { fromLocalDateString, toLocalDateString } from '@/utils/dateUtils';
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

  return (
    <div className="tw:flex tw:flex-col sm:tw:flex-row tw:items-stretch sm:tw:items-end tw:gap-sm tw:flex-1">
      <DatePickerInput
        placeholder="Pick a start date"
        label="From"
        minDate={fromLocalDateString(minDate)}
        maxDate={fromLocalDateString(maxDate)}
        value={fromLocalDateString(startDate)}
        onChange={handleStartDateChange}
        style={{ flex: 1 }}
      />
      <DatePickerInput
        placeholder="Pick an end date"
        label="To"
        minDate={fromLocalDateString(minDate)}
        maxDate={fromLocalDateString(maxDate)}
        value={fromLocalDateString(endDate)}
        onChange={handleEndDateChange}
        style={{ flex: 1 }}
      />
      <ValueInputBox param={param} value={paramValue} onChange={setParamValue} />
    </div>
  );
}
