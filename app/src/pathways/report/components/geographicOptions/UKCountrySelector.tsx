import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
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
    <div>
      <Label className="tw:text-sm tw:font-medium tw:mb-1 tw:block">Select country</Label>
      <Select value={selectedCountry} onValueChange={(val) => onCountryChange(val)}>
        <SelectTrigger className="tw:w-full">
          <SelectValue placeholder="Pick a country" />
        </SelectTrigger>
        <SelectContent>
          {countryOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
