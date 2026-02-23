/**
 * PolicyParameterSelectorValueSetter - Props-based version of ValueSetter container
 * Duplicated from components/policyParameterSelectorFrame/ValueSetter.tsx
 * Updates policy state via props instead of Redux dispatch
 *
 * Issue #602: Fixed immutability bug where shallow copy of policy didn't create
 * new references for nested arrays, causing React state updates to not trigger.
 */

import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Button, Separator } from '@/components/ui';
import { CURRENT_YEAR } from '@/constants';
import { getDateRange } from '@/libs/metadataUtils';
import { ParameterMetadata } from '@/types/metadata/parameterMetadata';
import { PolicyStateProps } from '@/types/pathwayState';
import { ValueInterval } from '@/types/subIngredients/valueInterval';
import { addParameterToPolicy } from '@/utils/policyParameterUpdate';
import { ModeSelectorButton, ValueSetterComponents, ValueSetterMode } from './valueSetters';

interface PolicyParameterSelectorValueSetterProps {
  param: ParameterMetadata;
  policy: PolicyStateProps;
  onPolicyUpdate: (updatedPolicy: PolicyStateProps) => void;
}

export default function PolicyParameterSelectorValueSetter({
  param,
  policy,
  onPolicyUpdate,
}: PolicyParameterSelectorValueSetterProps) {
  const [mode, setMode] = useState<ValueSetterMode>(ValueSetterMode.DEFAULT);

  // Get date ranges from metadata using utility selector
  const { minDate, maxDate } = useSelector(getDateRange);

  const [intervals, setIntervals] = useState<ValueInterval[]>([]);

  // Hoisted date state for all non-multi-year selectors
  const [startDate, setStartDate] = useState<string>(`${CURRENT_YEAR}-01-01`);
  const [endDate, setEndDate] = useState<string>(`${CURRENT_YEAR}-12-31`);

  function resetValueSettingState() {
    setIntervals([]);
  }

  function handleModeChange(newMode: ValueSetterMode) {
    resetValueSettingState();
    setMode(newMode);
  }

  function handleSubmit() {
    // Use immutable utility to add parameter intervals
    // This creates new array references to ensure React detects the state change
    const updatedPolicy = addParameterToPolicy(policy, param.parameter, intervals);

    // Notify parent of policy update
    onPolicyUpdate(updatedPolicy);

    // Reset state after submission
    resetValueSettingState();
  }

  const ValueSetterToRender = ValueSetterComponents[mode];

  const valueSetterProps = {
    minDate,
    maxDate,
    param,
    policy,
    intervals,
    setIntervals,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
  };

  return (
    <div className="tw:bg-gray-50 tw:border tw:border-gray-200 tw:m-0 tw:p-lg">
      <div className="tw:flex tw:flex-col tw:gap-sm">
        <p className="tw:font-bold">Current value</p>
        <Separator />
        <div className="tw:flex tw:flex-col sm:tw:flex-row tw:items-stretch sm:tw:items-end tw:gap-sm tw:w-full">
          <ValueSetterToRender {...valueSetterProps} />
          <div className="tw:flex tw:items-end tw:gap-sm">
            <ModeSelectorButton setMode={handleModeChange} />
            <Button onClick={handleSubmit} className="tw:flex-1">
              Add parameter
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
