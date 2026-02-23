import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
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
    <div>
      <Label className="tw:text-sm tw:font-medium tw:mb-1 tw:block">
        Select parliamentary constituency
      </Label>
      <Select value={selectedConstituency} onValueChange={(val) => onConstituencyChange(val)}>
        <SelectTrigger className="tw:w-full">
          <SelectValue placeholder="Pick a constituency" />
        </SelectTrigger>
        <SelectContent>
          {constituencyOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
