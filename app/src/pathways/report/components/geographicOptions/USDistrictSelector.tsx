import { useEffect, useMemo, useState } from 'react';
import { Group, Select, Text } from '@mantine/core';
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
  const handleStateChange = (stateName: string | null) => {
    setSelectedStateName(stateName || '');
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
      <Text size="sm" fw={500} mb={4}>
        Select Congressional District
      </Text>
      <Group gap="sm" align="flex-start">
        <Select
          placeholder="Pick a state"
          data={stateNamesForDistricts}
          value={selectedStateName}
          onChange={handleStateChange}
          searchable
          style={{ flex: 1 }}
        />
        {selectedStateName ? (
          <Select
            placeholder="Pick a district"
            data={districtOptionsWithLabels}
            value={selectedDistrict}
            onChange={(val) => onDistrictChange(val || '')}
            searchable
            style={{ width: 120 }}
          />
        ) : (
          <Select placeholder="—" data={[]} disabled style={{ width: 120 }} />
        )}
      </Group>
    </>
  );
}
