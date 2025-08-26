import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Stack, TextInput, Text } from '@mantine/core';
import FlowView from '@/components/common/FlowView';
import { updateSimulationLabel } from '@/reducers/simulationReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';

export default function SetSimulationLabelFrame({ onNavigate }: FlowComponentProps) {
  const dispatch = useDispatch();
  const simulationState = useSelector((state: RootState) => state.simulation);
  const policyState = useSelector((state: RootState) => state.policy);
  const populationState = useSelector((state: RootState) => state.population);
  
  // Initialize with existing label or generate a default
  const getDefaultLabel = () => {
    if (simulationState.label) {
      return simulationState.label;
    }
    
    // Generate a default based on policy and population
    const policyPart = policyState.label || 'Policy';
    const populationPart = populationState.label || 'Population';
    return `${policyPart} - ${populationPart}`;
  };
  
  const [label, setLabel] = useState<string>(getDefaultLabel());
  const [error, setError] = useState<string>('');

  const handleSubmit = () => {
    // Validate label
    if (!label.trim()) {
      setError('Please enter a label for your simulation');
      return;
    }
    
    if (label.length > 100) {
      setError('Label must be less than 100 characters');
      return;
    }
    
    // Update the simulation label in Redux
    dispatch(updateSimulationLabel(label.trim()));
    
    // Navigate to next step
    onNavigate('next');
  };

  const formInputs = (
    <Stack>
      <Text size="sm" c="dimmed">
        Give your simulation a descriptive name to help identify it later.
      </Text>
      
      <TextInput
        label="Simulation Label"
        placeholder="e.g., UBI Impact 2024, Tax Reform Analysis, Poverty Reduction Scenario"
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
        This label will help you identify this simulation when creating reports.
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
      title="Name Your Simulation"
      content={formInputs}
      primaryAction={primaryAction}
      cancelAction={cancelAction}
    />
  );
}