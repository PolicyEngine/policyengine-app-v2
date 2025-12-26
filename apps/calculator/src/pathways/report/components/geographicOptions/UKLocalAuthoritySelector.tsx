import { Select } from '@mantine/core';
import { RegionOption } from '@/utils/regionStrategies';

interface UKLocalAuthoritySelectorProps {
  localAuthorityOptions: RegionOption[];
  selectedLocalAuthority: string;
  onLocalAuthorityChange: (localAuthority: string) => void;
}

export default function UKLocalAuthoritySelector({
  localAuthorityOptions,
  selectedLocalAuthority,
  onLocalAuthorityChange,
}: UKLocalAuthoritySelectorProps) {
  return (
    <Select
      label="Select Local Authority"
      placeholder="Pick a local authority"
      data={localAuthorityOptions}
      value={selectedLocalAuthority}
      onChange={(val) => onLocalAuthorityChange(val || '')}
      searchable
    />
  );
}
