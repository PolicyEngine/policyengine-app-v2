import { Box, Radio, Select } from '@mantine/core';
import { RegionOption } from '@/utils/regionStrategies';

interface USGeographicOptionsProps {
  scope: 'national' | 'state' | 'congressional_district' | 'household';
  selectedRegion: string;
  stateOptions: RegionOption[];
  districtOptions: RegionOption[];
  onScopeChange: (scope: 'national' | 'state' | 'congressional_district' | 'household') => void;
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
  return (
    <>
      {/* National option */}
      <Radio
        value="national"
        label="All households nationally"
        checked={scope === 'national'}
        onChange={() => onScopeChange('national')}
      />

      {/* State option */}
      <Box>
        <Radio
          value="state"
          label="All households in a state"
          checked={scope === 'state'}
          onChange={() => onScopeChange('state')}
        />
        {scope === 'state' && stateOptions.length > 0 && (
          <Box ml={24} mt="xs">
            <Select
              label="Select State"
              placeholder="Pick a state"
              data={stateOptions}
              value={selectedRegion}
              onChange={(val) => onRegionChange(val || '')}
              searchable
            />
          </Box>
        )}
      </Box>

      {/* Congressional District option */}
      <Box>
        <Radio
          value="congressional_district"
          label="All households in a congressional district"
          checked={scope === 'congressional_district'}
          onChange={() => onScopeChange('congressional_district')}
        />
        {scope === 'congressional_district' && districtOptions.length > 0 && (
          <Box ml={24} mt="xs">
            <Select
              label="Select Congressional District"
              placeholder="Pick a congressional district"
              data={districtOptions}
              value={selectedRegion}
              onChange={(val) => onRegionChange(val || '')}
              searchable
            />
          </Box>
        )}
      </Box>

      {/* Household option */}
      <Radio
        value="household"
        label="Custom household"
        checked={scope === 'household'}
        onChange={() => onScopeChange('household')}
      />
    </>
  );
}
