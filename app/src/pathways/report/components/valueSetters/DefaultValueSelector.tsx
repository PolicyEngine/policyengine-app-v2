import { useEffect, useState } from 'react';
import { YearPickerInput } from '@mantine/dates';
import { FOREVER } from '@/constants';
import { ValueInterval } from '@/types/subIngredients/valueInterval';
import { fromLocalDateString, toLocalDateString } from '@/utils/dateUtils';
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
    setStartDate(toLocalDateString(value));
  }

  return (
    <div className="tw:flex tw:flex-col sm:tw:flex-row tw:items-stretch sm:tw:items-end tw:gap-sm tw:flex-1">
      <YearPickerInput
        placeholder="Pick a year"
        label="From"
        minDate={fromLocalDateString(minDate)}
        maxDate={fromLocalDateString(maxDate)}
        value={fromLocalDateString(startDate)}
        onChange={handleStartDateChange}
        style={{ flex: 1 }}
      />
      <div className="tw:flex tw:items-center tw:flex-1" style={{ height: '36px' }}>
        <span className="tw:text-sm tw:font-medium">onward:</span>
      </div>
      <div className="tw:flex-1">
        <ValueInputBox param={param} value={paramValue} onChange={setParamValue} />
      </div>
    </div>
  );
}
