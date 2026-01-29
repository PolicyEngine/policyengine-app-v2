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
import { Button, Container, Divider, Group, Stack, Text } from '@mantine/core';
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
    <Container bg="gray.0" bd="1px solid gray.2" m="0" p="lg">
      <Stack>
        <Text fw={700}>Current value</Text>
        <Divider style={{ padding: 0 }} />
        <Group align="flex-end" w="100%">
          <ValueSetterToRender {...valueSetterProps} />
          <ModeSelectorButton setMode={handleModeChange} />
          <Button onClick={handleSubmit}>Add parameter</Button>
        </Group>
      </Stack>
    </Container>
  );
}
