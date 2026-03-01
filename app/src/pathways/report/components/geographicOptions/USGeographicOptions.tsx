import { Label, RadioGroup, RadioGroupItem } from '@/components/ui';
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
  const handleScopeChange = (newScope: string) => {
    onRegionChange('');
    onScopeChange(newScope as USScopeType);
  };

  return (
    <RadioGroup value={scope} onValueChange={handleScopeChange}>
      {/* National option */}
      <div className="tw:flex tw:items-center tw:gap-2">
        <RadioGroupItem value={US_REGION_TYPES.NATIONAL} id="scope-national" />
        <Label htmlFor="scope-national">All households nationally</Label>
      </div>

      {/* State option */}
      <div>
        <div className="tw:flex tw:items-center tw:gap-2">
          <RadioGroupItem value={US_REGION_TYPES.STATE} id="scope-state" />
          <Label htmlFor="scope-state">All households in a state or federal district</Label>
        </div>
        {scope === US_REGION_TYPES.STATE && stateOptions.length > 0 && (
          <div className="tw:ml-6 tw:mt-xs">
            <USStateSelector
              stateOptions={stateOptions}
              selectedState={selectedRegion}
              onStateChange={onRegionChange}
            />
          </div>
        )}
      </div>

      {/* Congressional District option */}
      <div>
        <div className="tw:flex tw:items-center tw:gap-2">
          <RadioGroupItem value={US_REGION_TYPES.CONGRESSIONAL_DISTRICT} id="scope-district" />
          <Label htmlFor="scope-district">All households in a congressional district</Label>
        </div>
        {scope === US_REGION_TYPES.CONGRESSIONAL_DISTRICT && districtOptions.length > 0 && (
          <div className="tw:ml-6 tw:mt-xs">
            <USDistrictSelector
              districtOptions={districtOptions}
              selectedDistrict={selectedRegion}
              onDistrictChange={onRegionChange}
            />
          </div>
        )}
      </div>

      {/* Place (city) option */}
      <div>
        <div className="tw:flex tw:items-center tw:gap-2">
          <RadioGroupItem value={US_REGION_TYPES.PLACE} id="scope-place" />
          <Label htmlFor="scope-place">All households in a city</Label>
        </div>
        {scope === US_REGION_TYPES.PLACE && (
          <div className="tw:ml-6 tw:mt-xs">
            <USPlaceSelector selectedPlace={selectedRegion} onPlaceChange={onRegionChange} />
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
