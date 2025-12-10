import { Box, Radio, Select } from '@mantine/core';
import { RegionOption, UK_REGION_TYPES } from '@/utils/regionStrategies';
import { UKScopeType } from '@/types/regionTypes';

interface UKGeographicOptionsProps {
  scope: UKScopeType;
  selectedRegion: string;
  countryOptions: RegionOption[];
  constituencyOptions: RegionOption[];
  onScopeChange: (scope: UKScopeType) => void;
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
        value={UK_REGION_TYPES.NATIONAL}
        label="All households UK-wide"
        checked={scope === UK_REGION_TYPES.NATIONAL}
        onChange={() => onScopeChange(UK_REGION_TYPES.NATIONAL)}
      />

      {/* Country option */}
      <Box>
        <Radio
          value={UK_REGION_TYPES.COUNTRY}
          label="All households in a country"
          checked={scope === UK_REGION_TYPES.COUNTRY}
          onChange={() => onScopeChange(UK_REGION_TYPES.COUNTRY)}
        />
        {scope === UK_REGION_TYPES.COUNTRY && countryOptions.length > 0 && (
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
          value={UK_REGION_TYPES.CONSTITUENCY}
          label="All households in a constituency"
          checked={scope === UK_REGION_TYPES.CONSTITUENCY}
          onChange={() => onScopeChange(UK_REGION_TYPES.CONSTITUENCY)}
        />
        {scope === UK_REGION_TYPES.CONSTITUENCY && constituencyOptions.length > 0 && (
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
