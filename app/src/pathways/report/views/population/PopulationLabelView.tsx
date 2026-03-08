/**
 * PopulationLabelView - View for setting population label
 * Duplicated from SetPopulationLabelFrame
 * Props-based instead of Redux-based
 */

import { useState } from 'react';
import PathwayView from '@/components/common/PathwayView';
import { Input, Stack } from '@/components/ui';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { PathwayMode } from '@/types/pathwayModes/PathwayMode';
import { PopulationStateProps } from '@/types/pathwayState';
import {
  extractRegionDisplayValue,
  findPlaceFromRegionString,
  getPlaceDisplayName,
} from '@/utils/regionStrategies';

interface PopulationLabelViewProps {
  population: PopulationStateProps;
  mode: PathwayMode;
  simulationIndex?: 0 | 1; // Required if mode='report', ignored if mode='standalone'
  reportLabel?: string | null; // Optional for report context
  onUpdateLabel: (label: string) => void;
  onNext: () => void;
  onBack?: () => void;
}

export default function PopulationLabelView({
  population,
  mode,
  simulationIndex,
  reportLabel: _reportLabel = null,
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
        const geographyId = population.geography.geographyId;

        // Check if this is a US place (city)
        if (geographyId.startsWith('place/')) {
          const place = findPlaceFromRegionString(geographyId);
          if (place) {
            return `${getPlaceDisplayName(place.name)} Households`;
          }
        }

        // Use display value (strip prefix for UK regions and other types)
        const displayValue = extractRegionDisplayValue(geographyId);
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
      <p className="tw:text-sm tw:text-gray-500">Give your household(s) a descriptive name.</p>

      <div className="tw:flex tw:flex-col tw:gap-xs">
        <label className="tw:text-sm tw:font-medium">
          Household Label <span className="tw:text-red-500">*</span>
        </label>
        <Input
          placeholder="e.g., My Family 2025, All California Households, UK National Households"
          value={label}
          onChange={(event) => {
            setLabel(event.currentTarget.value);
            setError(''); // Clear error when user types
          }}
          maxLength={100}
        />
        {error && <p className="tw:text-sm tw:text-red-500">{error}</p>}
      </div>

      <p className="tw:text-xs tw:text-gray-500">
        This label will help you identify this household(s) when creating simulations.
      </p>
    </Stack>
  );

  const primaryAction = {
    label: `${initializeText} household(s)`,
    onClick: handleSubmit,
  };

  return (
    <PathwayView
      title="Name your household(s)"
      content={formInputs}
      primaryAction={primaryAction}
      backAction={onBack ? { onClick: onBack } : undefined}
    />
  );
}
