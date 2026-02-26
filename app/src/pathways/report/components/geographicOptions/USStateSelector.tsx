import { Select } from '@mantine/core';
import { RegionOption } from '@/utils/regionStrategies';

interface USStateSelectorProps {
  stateOptions: RegionOption[];
  selectedState: string;
  onStateChange: (state: string) => void;
}

export default function USStateSelector({
  stateOptions,
  selectedState,
  onStateChange,
}: USStateSelectorProps) {
  return (
    <Select
      label="Select State"
      placeholder="Pick a state"
      data={stateOptions}
      value={selectedState}
      onChange={(val) => onStateChange(val || '')}
      searchable
    />
  );
}
