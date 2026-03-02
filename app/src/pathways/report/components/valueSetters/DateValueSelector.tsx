import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ValueInterval } from '@/types/subIngredients/valueInterval';
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

  function handleStartDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    setStartDate(e.target.value);
  }

  function handleEndDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEndDate(e.target.value);
  }

  return (
    <div className="tw:flex tw:flex-col tw:sm:flex-row tw:items-stretch tw:sm:items-end tw:gap-sm tw:flex-1">
      <div className="tw:flex tw:flex-col tw:gap-1 tw:flex-1">
        <Label>From</Label>
        <Input
          type="date"
          placeholder="Pick a start date"
          min={minDate}
          max={maxDate}
          value={startDate ?? ''}
          onChange={handleStartDateChange}
        />
      </div>
      <div className="tw:flex tw:flex-col tw:gap-1 tw:flex-1">
        <Label>To</Label>
        <Input
          type="date"
          placeholder="Pick an end date"
          min={minDate}
          max={maxDate}
          value={endDate ?? ''}
          onChange={handleEndDateChange}
        />
      </div>
      <ValueInputBox param={param} value={paramValue} onChange={setParamValue} />
    </div>
  );
}
