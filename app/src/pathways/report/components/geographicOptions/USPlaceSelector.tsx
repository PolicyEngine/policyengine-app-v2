import { useEffect, useMemo, useState } from 'react';
import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { useRegions } from '@/hooks/useRegions';
import { findPlaceFromRegionString, getUSPlaces } from '@/utils/regionStrategies';

interface USPlaceSelectorProps {
  selectedPlace: string;
  onPlaceChange: (place: string) => void;
}

export default function USPlaceSelector({ selectedPlace, onPlaceChange }: USPlaceSelectorProps) {
  const [selectedStateName, setSelectedStateName] = useState<string>('');
  const { data: regions = [] } = useRegions('us');
  const allPlaces = useMemo(() => getUSPlaces(regions), [regions]);

  // Get unique state names for the state dropdown
  const stateNames = useMemo(() => {
    const names = new Set(allPlaces.map((place) => place.stateName).filter(Boolean));
    return [...names].sort().map((stateName) => ({ value: stateName!, label: stateName! }));
  }, [allPlaces]);

  // Initialize selectedStateName from selectedPlace if one is already selected
  useEffect(() => {
    if (selectedPlace) {
      const place =
        allPlaces.find((region) => region.value === selectedPlace) ??
        findPlaceFromRegionString(selectedPlace);
      if (place?.stateName && place.stateName !== selectedStateName) {
        setSelectedStateName(place.stateName);
      }
    }
  }, [allPlaces, selectedPlace, selectedStateName]);

  // Filter places based on selected state name
  const filteredPlaces = useMemo(
    () => allPlaces.filter((place) => place.stateName === selectedStateName),
    [allPlaces, selectedStateName]
  );

  // Format places for the dropdown sorted alphabetically
  const placeOptions = useMemo(
    () =>
      filteredPlaces
        .map((place) => ({ value: place.value, label: place.label }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [filteredPlaces]
  );

  // Handle state change for place selection
  const handleStateChange = (stateName: string) => {
    setSelectedStateName(stateName);
    // Auto-select the first place when a state is chosen
    if (stateName) {
      const statePlaces = allPlaces.filter((place) => place.stateName === stateName);
      if (statePlaces.length > 0) {
        onPlaceChange(statePlaces[0].value);
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
            {stateNames.map((state) => (
              <SelectItem key={state.value} value={state.value}>
                {state.label}
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
