import { Box, Radio, Select } from '@mantine/core';
import { RegionOption } from '@/utils/regionStrategies';

interface UKGeographicOptionsProps {
  scope: 'national' | 'country' | 'constituency' | 'household';
  selectedRegion: string;
  countryOptions: RegionOption[];
  constituencyOptions: RegionOption[];
  onScopeChange: (scope: 'national' | 'country' | 'constituency' | 'household') => void;
  onRegionChange: (region: string) => void;
}

export default function UKGeographicOptions({
  scope,
  selectedRegion,
  countryOptions,
  constituencyOptions,
  onScopeChange,
  onRegionChange,
}: UKGeographicOptionsProps) {
  return (
    <>
      {/* UK-wide option */}
      <Radio
        value="national"
        label="All households UK-wide"
        checked={scope === 'national'}
        onChange={() => onScopeChange('national')}
      />

      {/* Country option */}
      <Box>
        <Radio
          value="country"
          label="All households in a country"
          checked={scope === 'country'}
          onChange={() => onScopeChange('country')}
        />
        {scope === 'country' && countryOptions.length > 0 && (
          <Box ml={24} mt="xs">
            <Select
              label="Select Country"
              placeholder="Pick a country"
              data={countryOptions}
              value={selectedRegion}
              onChange={(val) => onRegionChange(val || '')}
              searchable
            />
          </Box>
        )}
      </Box>

      {/* Parliamentary Constituency option */}
      <Box>
        <Radio
          value="constituency"
          label="All households in a constituency"
          checked={scope === 'constituency'}
          onChange={() => onScopeChange('constituency')}
        />
        {scope === 'constituency' && constituencyOptions.length > 0 && (
          <Box ml={24} mt="xs">
            <Select
              label="Select Parliamentary Constituency"
              placeholder="Pick a constituency"
              data={constituencyOptions}
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
