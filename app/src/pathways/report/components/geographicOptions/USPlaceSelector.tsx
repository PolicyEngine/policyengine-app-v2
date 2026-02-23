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
  filterPlacesByState,
  findPlaceFromRegionString,
  getPlaceDisplayName,
  getPlaceStateNames,
  placeToRegionString,
} from '@/utils/regionStrategies';

interface USPlaceSelectorProps {
  selectedPlace: string;
  onPlaceChange: (place: string) => void;
}

export default function USPlaceSelector({ selectedPlace, onPlaceChange }: USPlaceSelectorProps) {
  const [selectedStateName, setSelectedStateName] = useState<string>('');

  // Get unique state names for the state dropdown
  const stateNames = useMemo(() => getPlaceStateNames(), []);

  // Initialize selectedStateName from selectedPlace if one is already selected
  useEffect(() => {
    if (selectedPlace) {
      const place = findPlaceFromRegionString(selectedPlace);
      if (place && place.stateName !== selectedStateName) {
        setSelectedStateName(place.stateName);
      }
    }
  }, [selectedPlace, selectedStateName]);

  // Filter places based on selected state name
  const filteredPlaces = useMemo(() => filterPlacesByState(selectedStateName), [selectedStateName]);

  // Format places for the dropdown with clean display names, sorted alphabetically
  const placeOptions = useMemo(
    () =>
      filteredPlaces
        .map((p) => ({
          value: placeToRegionString(p),
          label: getPlaceDisplayName(p.name),
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [filteredPlaces]
  );

  // Handle state change for place selection
  const handleStateChange = (stateName: string) => {
    setSelectedStateName(stateName);
    // Auto-select the first place when a state is chosen
    if (stateName) {
      const statePlaces = filterPlacesByState(stateName);
      if (statePlaces.length > 0) {
        onPlaceChange(placeToRegionString(statePlaces[0]));
      }
    } else {
      onPlaceChange('');
    }
  };

  return (
    <div className="tw:flex tw:items-start tw:gap-sm">
      <div className="tw:flex-1">
        <Label className="tw:text-sm tw:font-medium tw:mb-1 tw:block">Select state</Label>
        <Select value={selectedStateName} onValueChange={handleStateChange}>
          <SelectTrigger className="tw:w-full">
            <SelectValue placeholder="Choose a state" />
          </SelectTrigger>
          <SelectContent>
            {stateNames.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="tw:flex-[2]">
        <Label className="tw:text-sm tw:font-medium tw:mb-1 tw:block">Select city</Label>
        {selectedStateName ? (
          <Select value={selectedPlace} onValueChange={onPlaceChange}>
            <SelectTrigger className="tw:w-full">
              <SelectValue placeholder="Choose a city" />
            </SelectTrigger>
            <SelectContent>
              {placeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Select disabled>
            <SelectTrigger className="tw:w-full">
              <SelectValue placeholder="--" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="--">--</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
