import { Select } from '@mantine/core';
import { RegionOption } from '@/utils/regionStrategies';

interface UKCountrySelectorProps {
  countryOptions: RegionOption[];
  selectedCountry: string;
  onCountryChange: (country: string) => void;
}

export default function UKCountrySelector({
  countryOptions,
  selectedCountry,
  onCountryChange,
}: UKCountrySelectorProps) {
  return (
    <Select
      label="Select Country"
      placeholder="Pick a country"
      data={countryOptions}
      value={selectedCountry}
      onChange={(val) => onCountryChange(val || '')}
      searchable
    />
  );
}
