import { Box, Radio } from '@mantine/core';
import { USScopeType } from '@/types/regionTypes';
import { RegionOption, US_REGION_TYPES } from '@/utils/regionStrategies';
import USDistrictSelector from './USDistrictSelector';
import USPlaceSelector from './USPlaceSelector';
import USStateSelector from './USStateSelector';

interface USGeographicOptionsProps {
  scope: USScopeType;
  selectedRegion: string;
  stateOptions: RegionOption[];
  districtOptions: RegionOption[];
  onScopeChange: (scope: USScopeType) => void;
  onRegionChange: (region: string) => void;
}

export default function USGeographicOptions({
  scope,
  selectedRegion,
  stateOptions,
  districtOptions,
  onScopeChange,
  onRegionChange,
}: USGeographicOptionsProps) {
  // Handle scope change - clear region when switching scopes
  const handleScopeChange = (newScope: USScopeType) => {
    onRegionChange('');
    onScopeChange(newScope);
  };

  return (
    <>
      {/* National option */}
      <Radio
        value={US_REGION_TYPES.NATIONAL}
        label="All households nationally"
        checked={scope === US_REGION_TYPES.NATIONAL}
        onChange={() => handleScopeChange(US_REGION_TYPES.NATIONAL)}
      />

      {/* State option */}
      <Box>
        <Radio
          value={US_REGION_TYPES.STATE}
          label="All households in a state or federal district"
          checked={scope === US_REGION_TYPES.STATE}
          onChange={() => handleScopeChange(US_REGION_TYPES.STATE)}
        />
        {scope === US_REGION_TYPES.STATE && stateOptions.length > 0 && (
          <Box ml={24} mt="xs">
            <USStateSelector
              stateOptions={stateOptions}
              selectedState={selectedRegion}
              onStateChange={onRegionChange}
            />
          </Box>
        )}
      </Box>

      {/* Congressional District option */}
      <Box>
        <Radio
          value={US_REGION_TYPES.CONGRESSIONAL_DISTRICT}
          label="All households in a congressional district"
          checked={scope === US_REGION_TYPES.CONGRESSIONAL_DISTRICT}
          onChange={() => handleScopeChange(US_REGION_TYPES.CONGRESSIONAL_DISTRICT)}
        />
        {scope === US_REGION_TYPES.CONGRESSIONAL_DISTRICT && districtOptions.length > 0 && (
          <Box ml={24} mt="xs">
            <USDistrictSelector
              districtOptions={districtOptions}
              selectedDistrict={selectedRegion}
              onDistrictChange={onRegionChange}
            />
          </Box>
        )}
      </Box>

      {/* Place (Municipality) option */}
      <Box>
        <Radio
          value={US_REGION_TYPES.PLACE}
          label="All households in a municipality"
          checked={scope === US_REGION_TYPES.PLACE}
          onChange={() => handleScopeChange(US_REGION_TYPES.PLACE)}
        />
        {scope === US_REGION_TYPES.PLACE && (
          <Box ml={24} mt="xs">
            <USPlaceSelector selectedPlace={selectedRegion} onPlaceChange={onRegionChange} />
          </Box>
        )}
      </Box>

      {/* Household option */}
      <Radio
        value="household"
        label="Custom household"
        checked={scope === 'household'}
        onChange={() => handleScopeChange('household')}
      />
    </>
  );
}
