/**
 * PolicyParameterSelectorValueSetter - Props-based version of ValueSetter container
 * Duplicated from components/policyParameterSelectorFrame/ValueSetter.tsx
 * Updates policy state via props instead of Redux dispatch
 */

import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Button, Container, Divider, Group, Stack, Text } from '@mantine/core';
import { getDateRange } from '@/libs/metadataUtils';
import { PolicyStateProps } from '@/types/pathwayState';
import { ParameterMetadata } from '@/types/metadata/parameterMetadata';
import { getParameterByName } from '@/types/subIngredients/parameter';
import { ValueInterval, ValueIntervalCollection } from '@/types/subIngredients/valueInterval';
import {
  ValueSetterMode,
  ValueSetterComponents,
  ModeSelectorButton,
} from './valueSetters';

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
  const [startDate, setStartDate] = useState<string>('2025-01-01');
  const [endDate, setEndDate] = useState<string>('2025-12-31');

  function resetValueSettingState() {
    setIntervals([]);
  }

  function handleModeChange(newMode: ValueSetterMode) {
    resetValueSettingState();
    setMode(newMode);
  }

  function handleSubmit() {
    // This mimics the Redux reducer's addPolicyParamAtPosition logic
    // We need to update the policy's parameters array with new intervals

    const updatedPolicy = { ...policy };

    // Ensure parameters array exists
    if (!updatedPolicy.parameters) {
      updatedPolicy.parameters = [];
    }

    // Find existing parameter or create new one
    let existingParam = getParameterByName(updatedPolicy, param.parameter);

    if (!existingParam) {
      // Create new parameter entry
      existingParam = { name: param.parameter, values: [] };
      updatedPolicy.parameters.push(existingParam);
    }

    // Use ValueIntervalCollection to properly merge intervals
    const paramCollection = new ValueIntervalCollection(existingParam.values);

    // Add each interval (collection handles overlaps/merging)
    intervals.forEach((interval) => {
      paramCollection.addInterval(interval);
    });

    // Get the final intervals and update the parameter
    const newValues = paramCollection.getIntervals();
    existingParam.values = newValues;

    console.log('[PolicyParameterSelectorValueSetter] Updated policy:', updatedPolicy);
    console.log('[PolicyParameterSelectorValueSetter] Parameter:', param.parameter);
    console.log('[PolicyParameterSelectorValueSetter] New intervals:', newValues);

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
