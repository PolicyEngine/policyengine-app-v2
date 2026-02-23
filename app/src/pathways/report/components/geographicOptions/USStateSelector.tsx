import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
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
    <div>
      <Label className="tw:text-sm tw:font-medium tw:mb-1 tw:block">Select state</Label>
      <Select value={selectedState} onValueChange={(val) => onStateChange(val)}>
        <SelectTrigger className="tw:w-full">
          <SelectValue placeholder="Pick a state" />
        </SelectTrigger>
        <SelectContent>
          {stateOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
