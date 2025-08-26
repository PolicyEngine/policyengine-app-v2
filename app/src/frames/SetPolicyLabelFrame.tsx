import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Stack, TextInput, Text } from '@mantine/core';
import FlowView from '@/components/common/FlowView';
import { updateLabel } from '@/reducers/policyReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';

export default function SetPolicyLabelFrame({ onNavigate }: FlowComponentProps) {
  const dispatch = useDispatch();
  const policyState = useSelector((state: RootState) => state.policy);
  
  // Initialize with existing label or a default
  const getDefaultLabel = () => {
    if (policyState.label) {
      return policyState.label;
    }
    
    // Generate a default based on the number of parameters
    const paramCount = policyState.params.length;
    if (paramCount === 0) {
      return 'Custom Policy';
    } else if (paramCount === 1) {
      return `${policyState.params[0].name} Reform`;
    } else {
      return `Policy Reform (${paramCount} changes)`;
    }
  };
  
  const [label, setLabel] = useState<string>(getDefaultLabel());
  const [error, setError] = useState<string>('');

  const handleSubmit = () => {
    // Validate label
    if (!label.trim()) {
      setError('Please enter a label for your policy');
      return;
    }
    
    if (label.length > 100) {
      setError('Label must be less than 100 characters');
      return;
    }
    
    // Update the policy label in Redux
    dispatch(updateLabel(label.trim()));
    
    // Navigate to next step
    onNavigate('next');
  };

  const formInputs = (
    <Stack>
      <Text size="sm" c="dimmed">
        Give your policy a descriptive name to help identify it later.
      </Text>
      
      <TextInput
        label="Policy Label"
        placeholder="e.g., Universal Basic Income 2024, Tax Credit Expansion, Child Benefit Reform"
        value={label}
        onChange={(event) => {
          setLabel(event.currentTarget.value);
          setError(''); // Clear error when user types
        }}
        error={error}
        required
        maxLength={100}
      />
      
      <Text size="xs" c="dimmed">
        This label will help you identify this policy when creating simulations.
      </Text>
    </Stack>
  );

  const primaryAction = {
    label: 'Continue',
    onClick: handleSubmit,
  };

  const cancelAction = {
    label: 'Back',
    onClick: () => onNavigate('back'),
  };

  return (
    <FlowView
      title="Name Your Policy"
      content={formInputs}
      primaryAction={primaryAction}
      cancelAction={cancelAction}
    />
  );
}