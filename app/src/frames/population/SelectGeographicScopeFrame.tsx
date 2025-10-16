import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Stack } from '@mantine/core';
import FlowView from '@/components/common/FlowView';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { selectActivePopulation, selectCurrentPosition } from '@/reducers/activeSelectors';
import { createPopulationAtPosition, setGeographyAtPosition } from '@/reducers/populationReducer';
import { setMode } from '@/reducers/reportReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';
import { Geography } from '@/types/ingredients/Geography';
import {
  createGeographyFromScope,
  getUKConstituencies,
  getUKCountries,
  getUSStates,
} from '@/utils/regionStrategies';
import UKGeographicOptions from './UKGeographicOptions';
import USGeographicOptions from './USGeographicOptions';

type ScopeType = 'national' | 'country' | 'constituency' | 'state' | 'household';

export default function SelectGeographicScopeFrame({
  onNavigate,
  isInSubflow,
}: FlowComponentProps) {
  const dispatch = useDispatch();
  const [scope, setScope] = useState<ScopeType>('national');
  const [selectedRegion, setSelectedRegion] = useState('');

  // Get current position and population
  const currentPosition = useSelector((state: RootState) => selectCurrentPosition(state));
  const populationState = useSelector((state: RootState) => selectActivePopulation(state));

  // Get current country from URL and metadata from Redux
  const currentCountry = useCurrentCountry();
  const metadata = useSelector((state: RootState) => state.metadata);

  // Set mode to standalone if not in a subflow (this is the first frame of population flow)
  useEffect(() => {
    if (!isInSubflow) {
      dispatch(setMode('standalone'));
    }
  }, [dispatch, isInSubflow]);

  // Create population at current position if it doesn't exist
  useEffect(() => {
    if (!populationState) {
      dispatch(createPopulationAtPosition({ position: currentPosition }));
    }
  }, [dispatch, currentPosition, populationState]);

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

    // Dispatch geography if created (not household)
    if (geography) {
      dispatch(
        setGeographyAtPosition({
          position: currentPosition,
          geography: geography as Geography,
        })
      );
    }

    // Navigate based on scope - household goes to household builder, others to confirmation
    onNavigate(scope === 'household' ? 'household' : scope);
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

  return <FlowView title="Select Scope" content={formInputs} primaryAction={primaryAction} />;
}
