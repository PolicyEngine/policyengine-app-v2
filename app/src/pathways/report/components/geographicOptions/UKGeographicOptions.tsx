import { Box, Radio } from '@mantine/core';
import { UKScopeType } from '@/types/regionTypes';
import { RegionOption, UK_REGION_TYPES } from '@/utils/regionStrategies';
import UKConstituencySelector from './UKConstituencySelector';
import UKCountrySelector from './UKCountrySelector';
import UKLocalAuthoritySelector from './UKLocalAuthoritySelector';

interface UKGeographicOptionsProps {
  scope: UKScopeType;
  selectedRegion: string;
  countryOptions: RegionOption[];
  constituencyOptions: RegionOption[];
  localAuthorityOptions: RegionOption[];
  onScopeChange: (scope: UKScopeType) => void;
  onRegionChange: (region: string) => void;
}

export default function UKGeographicOptions({
  scope,
  selectedRegion,
  countryOptions,
  constituencyOptions,
  localAuthorityOptions,
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
            <UKCountrySelector
              countryOptions={countryOptions}
              selectedCountry={selectedRegion}
              onCountryChange={onRegionChange}
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
            <UKConstituencySelector
              constituencyOptions={constituencyOptions}
              selectedConstituency={selectedRegion}
              onConstituencyChange={onRegionChange}
            />
          </Box>
        )}
      </Box>

      {/* Local Authority option */}
      <Box>
        <Radio
          value={UK_REGION_TYPES.LOCAL_AUTHORITY}
          label="All households in a local authority"
          checked={scope === UK_REGION_TYPES.LOCAL_AUTHORITY}
          onChange={() => onScopeChange(UK_REGION_TYPES.LOCAL_AUTHORITY)}
        />
        {scope === UK_REGION_TYPES.LOCAL_AUTHORITY && localAuthorityOptions.length > 0 && (
          <Box ml={24} mt="xs">
            <UKLocalAuthoritySelector
              localAuthorityOptions={localAuthorityOptions}
              selectedLocalAuthority={selectedRegion}
              onLocalAuthorityChange={onRegionChange}
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
