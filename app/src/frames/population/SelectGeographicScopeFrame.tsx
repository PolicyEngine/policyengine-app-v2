import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Radio, Select, Stack } from '@mantine/core';
import FlowView from '@/components/common/FlowView';
import { uk_regions, us_regions } from '@/mocks/regions';
import { selectActivePopulation, selectCurrentPosition } from '@/reducers/activeSelectors';
import { createPopulationAtPosition, setGeographyAtPosition } from '@/reducers/populationReducer';
import { setMode } from '@/reducers/reportReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';
import { Geography } from '@/types/ingredients/Geography';

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
  const [scope, setScope] = useState<'national' | 'state' | 'household'>('national');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');

  // Get current position and population
  const currentPosition = useSelector((state: RootState) => selectCurrentPosition(state));
  const populationState = useSelector((state: RootState) => selectActivePopulation(state));

  // Get current country from metadata state, fallback to 'us' if not available
  const currentCountry: string =
    useSelector((state: RootState) => state.metadata.currentCountry) || 'us';

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

  const usStates = us_regions.result.economy_options.region
    .filter((r) => r.name !== 'us')
    .map((s) => ({ value: s.name, label: s.label }));

  const ukCountryOptions = uk_regions.result.economy_options.region
    .filter((r) => r.name.startsWith('country/'))
    .map((c) => ({ value: c.name, label: c.label }));

  // Show ALL constituencies (for now)
  const ukRegionOptions = uk_regions.result.economy_options.region
    .filter((r) => r.name.startsWith('constituency/'))
    .map((r) => ({ value: r.name, label: r.label }));

  /*
  // Previous filtering by UK country:
  const ukRegionOptions = uk_regions.result.economy_options.region.filter(r =>
    r.name.startsWith('constituency/') &&
    (selectedCountry ? r.name.toLowerCase().includes(selectedCountry.split('/')[1]) : true)
  );
  */

  const handleScopeChange = (value: string) => {
    setScope(value as 'national' | 'state' | 'household');

    if (value !== 'state') {
      setSelectedCountry('');
      setSelectedRegion('');
      // clear from local state only
    }
  };

  function submissionHandler() {
    // Validate that if state is selected, a region must be chosen
    if (scope === 'state' && !selectedRegion) {
      console.warn('State selected but no region chosen');
      return;
    }

    // Create Geography object for non-household selections
    if (scope !== 'household') {
      const geographicScope: 'national' | 'subnational' =
        scope === 'national' ? 'national' : 'subnational';

      // Use formatter functions to create properly formatted IDs
      const geographyId = formatGeographyId(
        currentCountry,
        selectedRegion || currentCountry,
        geographicScope
      );

      const displayId = formatDisplayId(currentCountry, geographyId, geographicScope);

      const geography: Geography = {
        id: displayId,
        countryId: currentCountry as any,
        scope: geographicScope,
        geographyId,
      };

      console.log('Created geography:', {
        countryId: currentCountry,
        scope: geographicScope,
        selectedRegion,
        geography,
      });

      dispatch(
        setGeographyAtPosition({
          position: currentPosition,
          geography,
        })
      );
    }
    onNavigate(scope);
  }

  const formInputs = (
    <Stack>
      <Radio
        value="national"
        label="National"
        checked={scope === 'national'}
        onChange={() => handleScopeChange('national')}
      />

      <Box>
        <Radio
          value="state"
          label="State"
          checked={scope === 'state'}
          onChange={() => handleScopeChange('state')}
        />

        {scope === 'state' && (
          <Box ml={24} mt="xs">
            {currentCountry === 'us' && (
              <Select
                label="Select State"
                placeholder="Pick a state"
                data={usStates}
                value={selectedRegion}
                onChange={(val) => {
                  setSelectedRegion(val || '');
                  // State will be handled in submissionHandler
                }}
              />
            )}

            {currentCountry === 'uk' && (
              <>
                {/* Note: Only storing final constituency selection, not country selection */}
                <Select
                  label="Select Country"
                  placeholder="Pick a country"
                  data={ukCountryOptions}
                  value={selectedCountry}
                  onChange={(val) => {
                    setSelectedCountry(val || '');
                    setSelectedRegion('');
                    // Region cleared in local state above
                  }}
                />
                {selectedCountry && (
                  <Select
                    label="Select Constituency"
                    placeholder="Pick a constituency"
                    data={ukRegionOptions}
                    value={selectedRegion}
                    onChange={(val) => {
                      setSelectedRegion(val || '');
                      // Region will be handled in submissionHandler
                    }}
                    searchable
                    mt="xs"
                  />
                )}
              </>
            )}
          </Box>
        )}
      </Box>

      <Radio
        value="household"
        label="Household"
        checked={scope === 'household'}
        onChange={() => handleScopeChange('household')}
      />
    </Stack>
  );

  const primaryAction = {
    label: 'Select Scope',
    onClick: submissionHandler,
  };

  return <FlowView title="Select Scope" content={formInputs} primaryAction={primaryAction} />;
}
