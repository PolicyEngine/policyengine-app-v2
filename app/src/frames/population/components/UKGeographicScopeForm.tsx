import { Box, Radio, Select, Stack } from '@mantine/core';
import { filterUKCountries, filterUKConstituencies } from '@/utils/regionFilters';

interface RegionOption {
  name: string;
  label: string;
}

interface UKGeographicScopeFormProps {
  scope: 'uk-wide' | 'country' | 'constituency' | 'household';
  selectedRegion: string;
  regionOptions: RegionOption[];
  onScopeChange: (scope: 'uk-wide' | 'country' | 'constituency' | 'household') => void;
  onRegionChange: (region: string) => void;
}

export default function UKGeographicScopeForm({
  scope,
  selectedRegion,
  regionOptions,
  onScopeChange,
  onRegionChange,
}: UKGeographicScopeFormProps) {
  const ukCountryOptions = filterUKCountries(regionOptions);
  const ukConstituencyOptions = filterUKConstituencies(regionOptions);

  return (
    <Stack>
      <Radio
        value="uk-wide"
        label="UK-wide"
        checked={scope === 'uk-wide'}
        onChange={() => onScopeChange('uk-wide')}
      />

      <Box>
        <Radio
          value="country"
          label="Country"
          checked={scope === 'country'}
          onChange={() => onScopeChange('country')}
        />

        {scope === 'country' && (
          <Box ml={24} mt="xs">
            <Select
              label="Select Country"
              placeholder="Pick a country"
              data={ukCountryOptions}
              value={selectedRegion}
              onChange={(val) => onRegionChange(val || '')}
              searchable
            />
          </Box>
        )}
      </Box>

      <Box>
        <Radio
          value="constituency"
          label="Parliamentary constituency"
          checked={scope === 'constituency'}
          onChange={() => onScopeChange('constituency')}
        />

        {scope === 'constituency' && (
          <Box ml={24} mt="xs">
            <Select
              label="Select constituency"
              placeholder="Search for a constituency"
              data={ukConstituencyOptions}
              value={selectedRegion}
              onChange={(val) => onRegionChange(val || '')}
              searchable
            />
          </Box>
        )}
      </Box>

      <Radio
        value="household"
        label="Household"
        checked={scope === 'household'}
        onChange={() => onScopeChange('household')}
      />
    </Stack>
  );
}
