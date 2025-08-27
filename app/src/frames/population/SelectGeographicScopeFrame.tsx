import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Radio, Select, Stack } from '@mantine/core';
import FlowView from '@/components/common/FlowView';
import { uk_regions, us_regions } from '@/mocks/regions';
import { setGeography } from '@/reducers/populationReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';
import { Geography } from '@/types/ingredients/Geography';

export default function SelectGeographicScopeFrame({ onNavigate }: FlowComponentProps) {
  const dispatch = useDispatch();
  const [scope, setScope] = useState<'national' | 'state' | 'household'>('national');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');

  // Get current country from metadata state, fallback to 'us' if not available
  const currentCountry: string =
    useSelector((state: RootState) => state.metadata.currentCountry) || 'us';

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

  // Helper function to extract value after last slash
  const extractRegionValue = (fullValue: string) => {
    return fullValue.split('/').pop() || fullValue;
  };

  function submissionHandler() {
    // Validate that if state is selected, a region must be chosen
    if (scope === 'state' && !selectedRegion) {
      // TODO: Add proper error handling/notification here
      console.warn('State selected but no region chosen');
      return;
    }

    // Create Geography object for non-household selections
    if (scope !== 'household') {
      const geography: Geography = {
        id:
          scope === 'national'
            ? currentCountry
            : `${currentCountry}-${extractRegionValue(selectedRegion)}`,
        countryId: currentCountry as any,
        scope: scope === 'national' ? 'national' : 'subnational',
        geographyId: scope === 'national' ? currentCountry : extractRegionValue(selectedRegion),
      };
      dispatch(setGeography(geography));
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
