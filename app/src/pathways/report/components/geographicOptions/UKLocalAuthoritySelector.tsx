import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
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
    <div>
      <Label className="tw:text-sm tw:font-medium tw:mb-1 tw:block">Select local authority</Label>
      <Select value={selectedLocalAuthority} onValueChange={(val) => onLocalAuthorityChange(val)}>
        <SelectTrigger className="tw:w-full">
          <SelectValue placeholder="Pick a local authority" />
        </SelectTrigger>
        <SelectContent>
          {localAuthorityOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
