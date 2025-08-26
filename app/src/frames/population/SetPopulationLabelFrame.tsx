import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Stack, Text, TextInput } from '@mantine/core';
import FlowView from '@/components/common/FlowView';
import { updatePopulationLabel } from '@/reducers/populationReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';

export default function SetPopulationLabelFrame({ onNavigate }: FlowComponentProps) {
  const dispatch = useDispatch();
  const populationState = useSelector((state: RootState) => state.population);

  // Initialize with existing label or generate a default based on population type
  const getDefaultLabel = () => {
    if (populationState.label) {
      return populationState.label;
    }

    if (populationState.geographicScope) {
      // Geographic population
      if (populationState.geographicScope === 'national') {
        return 'National Population';
      } else if (populationState.region) {
        return `${populationState.region} Population`;
      }
      return 'Geographic Population';
    }
    // Household population
    return 'Custom Household';
  };

  const [label, setLabel] = useState<string>(getDefaultLabel());
  const [error, setError] = useState<string>('');

  const handleSubmit = () => {
    // Validate label
    if (!label.trim()) {
      setError('Please enter a label for your population');
      return;
    }

    if (label.length > 100) {
      setError('Label must be less than 100 characters');
      return;
    }

    // Update the population label in Redux
    dispatch(updatePopulationLabel(label.trim()));

    // Navigate based on population type
    if (
      populationState.geographicScope === 'state' ||
      populationState.geographicScope === 'national'
    ) {
      onNavigate('geographic');
    } else {
      onNavigate('household');
    }
  };

  const formInputs = (
    <Stack>
      <Text size="sm" c="dimmed">
        Give your population a descriptive name to help identify it later.
      </Text>

      <TextInput
        label="Population Label"
        placeholder="e.g., My Family 2024, California Low Income, UK National Average"
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
        This label will help you identify this population when creating simulations.
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
      title="Name Your Population"
      content={formInputs}
      primaryAction={primaryAction}
      cancelAction={cancelAction}
    />
  );
}
