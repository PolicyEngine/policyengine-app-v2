import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ValueInterval } from '@/types/subIngredients/valueInterval';
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

  function handleStartYearChange(e: React.ChangeEvent<HTMLInputElement>) {
    const year = e.target.value;
    if (year && year.length === 4) {
      setStartDate(`${year}-01-01`);
    }
  }

  function handleEndYearChange(e: React.ChangeEvent<HTMLInputElement>) {
    const year = e.target.value;
    if (year && year.length === 4) {
      const endOfYearDate = dayjs(`${year}-01-01`).endOf('year').format('YYYY-MM-DD');
      setEndDate(endOfYearDate);
    }
  }

  const minYear = minDate ? parseInt(minDate.substring(0, 4), 10) : undefined;
  const maxYear = maxDate ? parseInt(maxDate.substring(0, 4), 10) : undefined;
  const startYear = startDate ? parseInt(startDate.substring(0, 4), 10) : undefined;
  const endYear = endDate ? parseInt(endDate.substring(0, 4), 10) : undefined;

  return (
    <div className="tw:flex tw:flex-col sm:tw:flex-row tw:items-stretch sm:tw:items-end tw:gap-sm tw:flex-1">
      <div className="tw:flex tw:flex-col tw:gap-1 tw:flex-1">
        <Label>From</Label>
        <Input
          type="number"
          placeholder="Pick a year"
          min={minYear}
          max={maxYear}
          value={startYear ?? ''}
          onChange={handleStartYearChange}
        />
      </div>
      <div className="tw:flex tw:flex-col tw:gap-1 tw:flex-1">
        <Label>To</Label>
        <Input
          type="number"
          placeholder="Pick a year"
          min={minYear}
          max={maxYear}
          value={endYear ?? ''}
          onChange={handleEndYearChange}
        />
      </div>
      <ValueInputBox param={param} value={paramValue} onChange={setParamValue} />
    </div>
  );
}
