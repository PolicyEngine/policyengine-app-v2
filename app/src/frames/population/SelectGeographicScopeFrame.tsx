import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FlowView from '@/components/common/FlowView';
import { selectActivePopulation, selectCurrentPosition } from '@/reducers/activeSelectors';
import { createPopulationAtPosition, setGeographyAtPosition } from '@/reducers/populationReducer';
import { setMode } from '@/reducers/reportReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';
import { Geography } from '@/types/ingredients/Geography';
import USGeographicScopeForm from './components/USGeographicScopeForm';
import UKGeographicScopeForm from './components/UKGeographicScopeForm';

/**
 * Format geography ID for US regions
 * US states need just the state code without prefix (e.g., "ca" not "state/ca")
 */
export function formatUSGeographyId(
  selectedValue: string,
  scope: 'national' | 'subnational'
): string {
  if (scope === 'national') {
    return 'us';
  }

  // Extract state code from "state/ca" or just "ca"
  if (selectedValue.includes('/')) {
    return selectedValue.split('/').pop() || selectedValue;
  }

  return selectedValue;
}

/**
 * Default geography ID formatter that preserves the full path
 * Used by UK and other countries that need full path preservation
 * UK regions keep their full path with prefix (e.g., "constituency/Brighton..." or "country/england")
 */
export function formatDefaultGeographyId(
  selectedValue: string,
  scope: 'national' | 'subnational',
  countryId: string
): string {
  if (scope === 'national') {
    return countryId;
  }

  // Keep the full path with prefix (constituency/ or country/)
  return selectedValue;
}

/**
 * Main function to format geography ID based on country
 * US requires special handling to extract state codes; all other countries use default formatter
 */
export function formatGeographyId(
  countryId: string,
  selectedValue: string,
  scope: 'national' | 'subnational'
): string {
  // US needs special handling to extract state codes (e.g., "ca" from "state/ca")
  if (countryId === 'us') {
    return formatUSGeographyId(selectedValue, scope);
  }

  // All other countries (including UK) use default formatter which preserves full paths
  return formatDefaultGeographyId(selectedValue, scope, countryId);
}

/**
 * Format display ID for Geography.id field
 * Converts slashes to hyphens and adds country prefix
 */
export function formatDisplayId(
  countryId: string,
  geographyId: string,
  scope: 'national' | 'subnational'
): string {
  if (scope === 'national') {
    return countryId;
  }

  // Replace slashes with hyphens for ID format
  const sanitizedValue = geographyId.replace(/\//g, '-');
  return `${countryId}-${sanitizedValue}`;
}

export default function SelectGeographicScopeFrame({
  onNavigate,
  isInSubflow,
}: FlowComponentProps) {
  const dispatch = useDispatch();

  // US-specific state
  const [usScope, setUsScope] = useState<'national' | 'state' | 'household'>('national');
  const [selectedUsState, setSelectedUsState] = useState('');

  // UK-specific state
  const [ukScope, setUkScope] = useState<'uk-wide' | 'country' | 'constituency' | 'household'>(
    'uk-wide'
  );
  const [selectedUkRegion, setSelectedUkRegion] = useState('');

  // Get current position and population
  const currentPosition = useSelector((state: RootState) => selectCurrentPosition(state));
  const populationState = useSelector((state: RootState) => selectActivePopulation(state));

  // Get current country and region options from metadata state
  const currentCountry: string =
    useSelector((state: RootState) => state.metadata.currentCountry) || 'us';
  const regionOptions = useSelector(
    (state: RootState) => state.metadata.economyOptions?.region || []
  );

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

  const handleUsScopeChange = (value: 'national' | 'state' | 'household') => {
    setUsScope(value);
    if (value !== 'state') {
      setSelectedUsState('');
    }
  };

  const handleUkScopeChange = (
    value: 'uk-wide' | 'country' | 'constituency' | 'household'
  ) => {
    setUkScope(value);
    if (value !== 'country' && value !== 'constituency') {
      setSelectedUkRegion('');
    }
  };

  function submissionHandler() {
    let scope: 'national' | 'subnational';
    let selectedValue: string;

    // Determine scope and selected value based on country
    if (currentCountry === 'us') {
      if (usScope === 'household') {
        onNavigate('household');
        return;
      }

      scope = usScope === 'national' ? 'national' : 'subnational';
      selectedValue = usScope === 'state' ? selectedUsState : currentCountry;

      // Validate state selection
      if (usScope === 'state' && !selectedUsState) {
        console.warn('State selected but no state chosen');
        return;
      }
    } else if (currentCountry === 'uk') {
      if (ukScope === 'household') {
        onNavigate('household');
        return;
      }

      scope = ukScope === 'uk-wide' ? 'national' : 'subnational';
      selectedValue = ukScope === 'uk-wide' ? currentCountry : selectedUkRegion;

      // Validate region selection
      if ((ukScope === 'country' || ukScope === 'constituency') && !selectedUkRegion) {
        console.warn('Region selected but no region chosen');
        return;
      }
    } else {
      console.error('Unsupported country:', currentCountry);
      return;
    }

    // Create Geography object
    const geographyId = formatGeographyId(currentCountry, selectedValue, scope);
    const displayId = formatDisplayId(currentCountry, geographyId, scope);

    const geography: Geography = {
      id: displayId,
      countryId: currentCountry as any,
      scope: scope,
      geographyId,
    };

    console.log('Created geography:', {
      countryId: currentCountry,
      scope,
      selectedValue,
      geography,
    });

    dispatch(
      setGeographyAtPosition({
        position: currentPosition,
        geography,
      })
    );

    // Navigate based on household vs non-household
    const navTarget =
      (currentCountry === 'us' ? usScope : ukScope) === 'household' ? 'household' : 'state';
    onNavigate(navTarget as any);
  }

  const formInputs = (
    <>
      {currentCountry === 'us' && (
        <USGeographicScopeForm
          scope={usScope}
          selectedState={selectedUsState}
          regionOptions={regionOptions}
          onScopeChange={handleUsScopeChange}
          onStateChange={setSelectedUsState}
        />
      )}

      {currentCountry === 'uk' && (
        <UKGeographicScopeForm
          scope={ukScope}
          selectedRegion={selectedUkRegion}
          regionOptions={regionOptions}
          onScopeChange={handleUkScopeChange}
          onRegionChange={setSelectedUkRegion}
        />
      )}
    </>
  );

  const primaryAction = {
    label: 'Select scope',
    onClick: submissionHandler,
  };

  return <FlowView title="Select scope" content={formInputs} primaryAction={primaryAction} />;
}
