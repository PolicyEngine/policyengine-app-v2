/**
 * PopulationLabelView - View for setting population label
 * Duplicated from SetPopulationLabelFrame
 * Props-based instead of Redux-based
 */

import { useState } from 'react';
import { Stack, Text, TextInput } from '@mantine/core';
import FlowView from '@/components/common/FlowView';
import { PopulationStateProps } from '@/types/pathwayState';
import { extractRegionDisplayValue } from '@/utils/regionStrategies';
import { PathwayMode } from '@/types/pathwayModes/PathwayMode';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

interface PopulationLabelViewProps {
  population: PopulationStateProps;
  mode: PathwayMode;
  simulationIndex?: 0 | 1; // Required if mode='report', ignored if mode='standalone'
  reportLabel?: string | null; // Optional for report context
  onUpdateLabel: (label: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function PopulationLabelView({
  population,
  mode,
  simulationIndex,
  reportLabel = null,
  onUpdateLabel,
  onNext,
  onBack,
}: PopulationLabelViewProps) {
  // Validate that required props are present in report mode
  if (mode === 'report' && simulationIndex === undefined) {
    throw new Error('[PopulationLabelView] simulationIndex is required when mode is "report"');
  }

  const countryId = useCurrentCountry();
  const initializeText = countryId === 'uk' ? 'Initialise' : 'Initialize';

  // Initialize with existing label or generate a default based on population type
  const getDefaultLabel = () => {
    if (population?.label) {
      return population.label;
    }

    if (population?.geography) {
      // Geographic population
      if (population.geography.scope === 'national') {
        return 'National Households';
      } else if (population.geography.geographyId) {
        // Use display value (strip prefix for UK regions)
        const displayValue = extractRegionDisplayValue(population.geography.geographyId);
        return `${displayValue} Households`;
      }
      return 'Regional Households';
    }
    // Household population
    return 'Custom Household';
  };

  const [label, setLabel] = useState<string>(getDefaultLabel());
  const [error, setError] = useState<string>('');

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

    onUpdateLabel(label.trim());
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
    label: `${initializeText} household(s)`,
    onClick: handleSubmit,
  };

  return (
    <FlowView
      title="Name your household(s)"
      content={formInputs}
      primaryAction={primaryAction}
      backAction={{ onClick: onBack }}
    />
  );
}
