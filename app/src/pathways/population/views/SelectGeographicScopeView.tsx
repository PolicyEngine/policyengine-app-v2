import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Stack } from '@mantine/core';
import FlowView from '@/components/common/FlowView';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { RootState } from '@/store';
import { Geography } from '@/types/ingredients/Geography';
import {
  createGeographyFromScope,
  getUKConstituencies,
  getUKCountries,
  getUSStates,
} from '@/utils/regionStrategies';
import UKGeographicOptions from '@/frames/population/UKGeographicOptions';
import USGeographicOptions from '@/frames/population/USGeographicOptions';
import { PopulationState, ScopeType } from '../types';

interface SelectGeographicScopeViewProps {
  state: PopulationState;
  onStateChange: (newState: Partial<PopulationState>) => void;
  onNext: () => void;
  onBack: () => void;
  onCancel?: () => void;
}

/**
 * SelectGeographicScopeView - First step in population pathway.
 *
 * Allows user to select the scope of their population:
 * - National (all households in country)
 * - State/Country/Constituency (specific region)
 * - Household (custom household builder)
 */
export default function SelectGeographicScopeView({
  state,
  onStateChange,
  onNext,
}: SelectGeographicScopeViewProps) {
  const [scope, setScope] = useState<ScopeType>('national');
  const [selectedRegion, setSelectedRegion] = useState('');

  // Get current country from URL and metadata from Redux
  const currentCountry = useCurrentCountry();
  const metadata = useSelector((state: RootState) => state.metadata);

  // Get region data from metadata
  const regionData = metadata.economyOptions?.region || [];

  // Get region options based on country
  const usStates = currentCountry === 'us' ? getUSStates(regionData) : [];
  const ukCountries = currentCountry === 'uk' ? getUKCountries(regionData) : [];
  const ukConstituencies = currentCountry === 'uk' ? getUKConstituencies(regionData) : [];

  const handleScopeChange = (value: ScopeType) => {
    setScope(value);
    setSelectedRegion(''); // Clear selection when scope changes
  };

  function submissionHandler() {
    // Validate that if a regional scope is selected, a region must be chosen
    const needsRegion = ['state', 'country', 'constituency'].includes(scope);
    if (needsRegion && !selectedRegion) {
      console.warn(`${scope} selected but no region chosen`);
      return;
    }

    // Create geography from scope selection
    const geography = createGeographyFromScope(scope, currentCountry, selectedRegion);

    // Update state with geography if created (not household)
    if (geography) {
      onStateChange({
        type: 'geography',
        geography: geography as Geography,
        household: null, // Clear household if switching to geographic
      });
    } else {
      // Household scope - clear geography
      onStateChange({
        type: 'household',
        geography: null,
        household: null, // Will be built in next frame
      });
    }

    // Navigate to next step
    onNext();
  }

  const formInputs = (
    <Stack>
      {currentCountry === 'uk' ? (
        <UKGeographicOptions
          scope={scope as 'national' | 'country' | 'constituency' | 'household'}
          selectedRegion={selectedRegion}
          countryOptions={ukCountries}
          constituencyOptions={ukConstituencies}
          onScopeChange={(newScope) => handleScopeChange(newScope)}
          onRegionChange={setSelectedRegion}
        />
      ) : (
        <USGeographicOptions
          scope={scope as 'national' | 'state' | 'household'}
          selectedRegion={selectedRegion}
          stateOptions={usStates}
          onScopeChange={(newScope) => handleScopeChange(newScope)}
          onRegionChange={setSelectedRegion}
        />
      )}
    </Stack>
  );

  const primaryAction = {
    label: 'Select Scope',
    onClick: submissionHandler,
  };

  return (
    <FlowView title="Select Household Scope" content={formInputs} primaryAction={primaryAction} />
  );
}
