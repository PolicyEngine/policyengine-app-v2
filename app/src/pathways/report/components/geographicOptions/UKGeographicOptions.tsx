import { Label, RadioGroup, RadioGroupItem } from '@/components/ui';
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
  const handleScopeChange = (newScope: string) => {
    onRegionChange('');
    onScopeChange(newScope as UKScopeType);
  };

  return (
    <RadioGroup value={scope} onValueChange={handleScopeChange}>
      {/* UK-wide option */}
      <div className="tw:flex tw:items-center tw:gap-2">
        <RadioGroupItem value={UK_REGION_TYPES.NATIONAL} id="scope-national" />
        <Label htmlFor="scope-national">All households UK-wide</Label>
      </div>

      {/* Country option */}
      <div>
        <div className="tw:flex tw:items-center tw:gap-2">
          <RadioGroupItem value={UK_REGION_TYPES.COUNTRY} id="scope-country" />
          <Label htmlFor="scope-country">All households in a country</Label>
        </div>
        {scope === UK_REGION_TYPES.COUNTRY && countryOptions.length > 0 && (
          <div className="tw:ml-6 tw:mt-xs">
            <UKCountrySelector
              countryOptions={countryOptions}
              selectedCountry={selectedRegion}
              onCountryChange={onRegionChange}
            />
          </div>
        )}
      </div>

      {/* Parliamentary Constituency option */}
      <div>
        <div className="tw:flex tw:items-center tw:gap-2">
          <RadioGroupItem value={UK_REGION_TYPES.CONSTITUENCY} id="scope-constituency" />
          <Label htmlFor="scope-constituency">All households in a constituency</Label>
        </div>
        {scope === UK_REGION_TYPES.CONSTITUENCY && constituencyOptions.length > 0 && (
          <div className="tw:ml-6 tw:mt-xs">
            <UKConstituencySelector
              constituencyOptions={constituencyOptions}
              selectedConstituency={selectedRegion}
              onConstituencyChange={onRegionChange}
            />
          </div>
        )}
      </div>

      {/* Local Authority option */}
      <div>
        <div className="tw:flex tw:items-center tw:gap-2">
          <RadioGroupItem value={UK_REGION_TYPES.LOCAL_AUTHORITY} id="scope-local-authority" />
          <Label htmlFor="scope-local-authority">All households in a local authority</Label>
        </div>
        {scope === UK_REGION_TYPES.LOCAL_AUTHORITY && localAuthorityOptions.length > 0 && (
          <div className="tw:ml-6 tw:mt-xs">
            <UKLocalAuthoritySelector
              localAuthorityOptions={localAuthorityOptions}
              selectedLocalAuthority={selectedRegion}
              onLocalAuthorityChange={onRegionChange}
            />
          </div>
        )}
      </div>

      {/* Household option */}
      <div className="tw:flex tw:items-center tw:gap-2">
        <RadioGroupItem value="household" id="scope-household" />
        <Label htmlFor="scope-household">Custom household</Label>
      </div>
    </RadioGroup>
  );
}
