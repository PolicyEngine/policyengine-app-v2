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
import { colors } from '@/designTokens/colors';
import { getDateRange } from '@/libs/metadataUtils';
import { RootState } from '@/store';
import { ParameterMetadata } from '@/types/metadata/parameterMetadata';
import { PolicyStateProps } from '@/types/pathwayState';
import { ValueInterval } from '@/types/subIngredients/valueInterval';
import {
  NO_EFFECTIVE_PARAMETER_CHANGE_MESSAGE,
  normalizeParameterIntervals,
  normalizePolicyParameters,
} from '@/utils/policyCurrentLaw';
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
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  // Get date ranges from metadata using utility selector
  const { minDate, maxDate } = useSelector(getDateRange);
  const currentLawMetadata = useSelector((state: RootState) => state.metadata.parameters);

  const [intervals, setIntervals] = useState<ValueInterval[]>([]);

  // Hoisted date state for all non-multi-year selectors
  const [startDate, setStartDate] = useState<string>(`${CURRENT_YEAR}-01-01`);
  const [endDate, setEndDate] = useState<string>(`${CURRENT_YEAR}-12-31`);

  function resetValueSettingState() {
    setIntervals([]);
  }

  function handleModeChange(newMode: ValueSetterMode) {
    resetValueSettingState();
    setValidationMessage(null);
    setMode(newMode);
  }

  function handleSubmit() {
    if (intervals.length === 0) {
      return;
    }

    // Use immutable utility to add parameter intervals
    // This creates new array references to ensure React detects the state change
    const candidatePolicy = addParameterToPolicy(policy, param.parameter, intervals);
    const effectiveParameters = normalizePolicyParameters(
      candidatePolicy.parameters,
      currentLawMetadata
    );
    const updatedPolicy = { ...candidatePolicy, parameters: effectiveParameters };

    setValidationMessage(
      normalizeParameterIntervals(intervals, currentLawMetadata[param.parameter]?.values).length ===
        0
        ? NO_EFFECTIVE_PARAMETER_CHANGE_MESSAGE
        : null
    );

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
        <div className="tw:flex tw:flex-col tw:sm:flex-row tw:items-stretch tw:sm:items-end tw:gap-sm tw:w-full">
          <ValueSetterToRender {...valueSetterProps} />
          <div className="tw:flex tw:items-end tw:gap-sm">
            <ModeSelectorButton setMode={handleModeChange} />
            <Button onClick={handleSubmit} className="tw:flex-1">
              Add parameter
            </Button>
          </div>
        </div>
        {validationMessage && (
          <p role="status" className="tw:text-sm" style={{ color: colors.text.warning }}>
            {validationMessage}
          </p>
        )}
      </div>
    </div>
  );
}
