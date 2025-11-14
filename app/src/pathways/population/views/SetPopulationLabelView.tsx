import { useEffect, useState } from 'react';
import { Stack, Text, TextInput } from '@mantine/core';
import FlowView from '@/components/common/FlowView';
import { extractRegionDisplayValue } from '@/utils/regionStrategies';
import { PopulationState } from '../types';

interface SetPopulationLabelViewProps {
  state: PopulationState;
  onStateChange: (newState: Partial<PopulationState>) => void;
  onNext: () => void;
  onBack: () => void;
  onCancel?: () => void;
}

/**
 * SetPopulationLabelView - Second step in population pathway.
 *
 * Allows user to set a descriptive label for their population.
 * Generates intelligent defaults based on population type (geographic vs household).
 */
export default function SetPopulationLabelView({
  state,
  onStateChange,
  onNext,
  onBack,
}: SetPopulationLabelViewProps) {
  // Initialize with existing label or generate a default based on population type
  const getDefaultLabel = () => {
    if (state.label) {
      return state.label;
    }

    if (state.geography) {
      // Geographic population
      if (state.geography.scope === 'national') {
        return 'National Households';
      } else if (state.geography.geographyId) {
        // Use display value (strip prefix for UK regions)
        const displayValue = extractRegionDisplayValue(state.geography.geographyId);
        return `${displayValue} Households`;
      }
      return 'Regional Households';
    }
    // Household population
    return 'Custom Household';
  };

  const [label, setLabel] = useState<string>(getDefaultLabel());
  const [error, setError] = useState<string>('');

  // Update state when default label changes
  useEffect(() => {
    const defaultLabel = getDefaultLabel();
    if (!state.label && defaultLabel !== label) {
      setLabel(defaultLabel);
    }
  }, [state.geography, state.label]);

  const handleSubmit = () => {
    // Validate label
    if (!label.trim()) {
      setError('Please enter a label for your household(s)');
      return;
    }

    if (label.length > 100) {
      setError('Label must be less than 100 characters');
      return;
    }

    // Update the population label
    onStateChange({ label: label.trim() });

    // Navigate to next step
    onNext();
  };

  const formInputs = (
    <Stack>
      <Text size="sm" c="dimmed">
        Give your household(s) a descriptive name.
      </Text>

      <TextInput
        label="Household Label"
        placeholder="e.g., My Family 2025, All California Households, UK National Households"
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
        This label will help you identify this household(s) when creating simulations.
      </Text>
    </Stack>
  );

  const primaryAction = {
    label: 'Continue',
    onClick: handleSubmit,
  };

  const cancelAction = {
    label: 'Back',
    onClick: onBack,
  };

  return (
    <FlowView
      title="Name Your Household(s)"
      content={formInputs}
      primaryAction={primaryAction}
      cancelAction={cancelAction}
    />
  );
}
