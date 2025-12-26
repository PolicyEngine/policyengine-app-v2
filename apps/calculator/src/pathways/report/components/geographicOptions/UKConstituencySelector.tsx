import { Select } from '@mantine/core';
import { RegionOption } from '@/utils/regionStrategies';

interface UKConstituencySelectorProps {
  constituencyOptions: RegionOption[];
  selectedConstituency: string;
  onConstituencyChange: (constituency: string) => void;
}

export default function UKConstituencySelector({
  constituencyOptions,
  selectedConstituency,
  onConstituencyChange,
}: UKConstituencySelectorProps) {
  return (
    <Select
      label="Select Parliamentary Constituency"
      placeholder="Pick a constituency"
      data={constituencyOptions}
      value={selectedConstituency}
      onChange={(val) => onConstituencyChange(val || '')}
      searchable
    />
  );
}
