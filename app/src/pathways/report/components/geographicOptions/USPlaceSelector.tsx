import { useEffect, useMemo, useState } from 'react';
import { Group, Select, Text } from '@mantine/core';
import {
  filterPlacesByState,
  findPlaceFromRegionString,
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

  // Format places for the dropdown
  const placeOptions = useMemo(
    () =>
      filteredPlaces.map((p) => ({
        value: placeToRegionString(p),
        label: p.name,
      })),
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
    <>
      <Text size="sm" fw={500} mb={4}>
        Select City
      </Text>
      <Group gap="sm" align="flex-start">
        <Select
          placeholder="Pick a state"
          data={stateNames}
          value={selectedStateName}
          onChange={handleStateChange}
          searchable
          style={{ flex: 1 }}
        />
        {selectedStateName ? (
          <Select
            placeholder="Pick a city"
            data={placeOptions}
            value={selectedPlace}
            onChange={(val) => onPlaceChange(val || '')}
            searchable
            style={{ flex: 2 }}
          />
        ) : (
          <Select placeholder="--" data={[]} disabled style={{ flex: 2 }} />
        )}
      </Group>
    </>
  );
}
