import { useEffect, useMemo, useState } from 'react';
import { Group, Select, Text } from '@mantine/core';
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
  const handleStateChange = (stateName: string | null) => {
    setSelectedStateName(stateName || '');
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
    <Group gap="sm" align="flex-start">
      <div style={{ flex: 1 }}>
        <Text size="sm" fw={500} mb={4}>
          Select state
        </Text>
        <Select
          placeholder="Choose a state"
          data={stateNames}
          value={selectedStateName}
          onChange={handleStateChange}
          searchable
        />
      </div>
      <div style={{ flex: 2 }}>
        <Text size="sm" fw={500} mb={4}>
          Select community
        </Text>
        {selectedStateName ? (
          <Select
            placeholder="Choose a community"
            data={placeOptions}
            value={selectedPlace}
            onChange={(val) => {
              // If user clicks the same option again (val is null), keep the current selection
              if (val !== null) {
                onPlaceChange(val);
              }
            }}
            searchable
          />
        ) : (
          <Select placeholder="--" data={[]} disabled />
        )}
      </div>
    </Group>
  );
}
