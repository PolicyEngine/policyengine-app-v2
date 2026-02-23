import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FOREVER } from '@/constants';
import { ValueInterval } from '@/types/subIngredients/valueInterval';
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

  function handleStartYearChange(e: React.ChangeEvent<HTMLInputElement>) {
    const year = e.target.value;
    if (year && year.length === 4) {
      setStartDate(`${year}-01-01`);
    }
  }

  const minYear = minDate ? parseInt(minDate.substring(0, 4), 10) : undefined;
  const maxYear = maxDate ? parseInt(maxDate.substring(0, 4), 10) : undefined;
  const startYear = startDate ? parseInt(startDate.substring(0, 4), 10) : undefined;

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
      <div className="tw:flex tw:items-center tw:flex-1" style={{ height: '36px' }}>
        <span className="tw:text-sm tw:font-medium">onward:</span>
      </div>
      <div className="tw:flex-1">
        <ValueInputBox param={param} value={paramValue} onChange={setParamValue} />
      </div>
    </div>
  );
}
