import { useEffect, useMemo, useState } from 'react';
import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import {
  filterDistrictsByState,
  formatDistrictOptionsForDisplay,
  getStateNameFromDistrict,
  RegionOption,
} from '@/utils/regionStrategies';

interface USDistrictSelectorProps {
  districtOptions: RegionOption[];
  selectedDistrict: string;
  onDistrictChange: (district: string) => void;
}

export default function USDistrictSelector({
  districtOptions,
  selectedDistrict,
  onDistrictChange,
}: USDistrictSelectorProps) {
  const [selectedStateName, setSelectedStateName] = useState<string>('');

  // Get unique state names from districts for the state dropdown
  const stateNamesForDistricts = useMemo(() => {
    const names = new Set(districtOptions.map((d) => d.stateName).filter(Boolean));
    return Array.from(names)
      .sort()
      .map((name) => ({ value: name as string, label: name as string }));
  }, [districtOptions]);

  // Initialize selectedStateName from selectedDistrict if one is already selected
  useEffect(() => {
    if (selectedDistrict) {
      const stateName = getStateNameFromDistrict(selectedDistrict, districtOptions);
      if (stateName && stateName !== selectedStateName) {
        setSelectedStateName(stateName);
      }
    }
  }, [selectedDistrict, districtOptions, selectedStateName]);

  // Filter districts based on selected state name
  const filteredDistrictOptions = useMemo(
    () => filterDistrictsByState(districtOptions, selectedStateName),
    [selectedStateName, districtOptions]
  );

  // Format district options for display
  const districtOptionsWithLabels = useMemo(
    () => formatDistrictOptionsForDisplay(filteredDistrictOptions),
    [filteredDistrictOptions]
  );

  // Handle state change for district selection
  const handleStateChange = (stateName: string) => {
    setSelectedStateName(stateName);
    // Auto-select the first district when a state is chosen
    if (stateName) {
      const stateDistricts = filterDistrictsByState(districtOptions, stateName);
      if (stateDistricts.length > 0) {
        onDistrictChange(stateDistricts[0].value);
      }
    } else {
      onDistrictChange('');
    }
  };

  return (
    <>
      <Label className="tw:text-sm tw:font-medium tw:mb-1 tw:block">
        Select congressional district
      </Label>
      <div className="tw:flex tw:items-start tw:gap-sm">
        <div className="tw:flex-1">
          <Select value={selectedStateName} onValueChange={handleStateChange}>
            <SelectTrigger className="tw:w-full">
              <SelectValue placeholder="Pick a state" />
            </SelectTrigger>
            <SelectContent>
              {stateNamesForDistricts.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedStateName ? (
          <div style={{ width: 120 }}>
            <Select value={selectedDistrict} onValueChange={(val) => onDistrictChange(val)}>
              <SelectTrigger className="tw:w-full">
                <SelectValue placeholder="Pick a district" />
              </SelectTrigger>
              <SelectContent>
                {districtOptionsWithLabels.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div style={{ width: 120 }}>
            <Select disabled>
              <SelectTrigger className="tw:w-full">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="--">--</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </>
  );
}
