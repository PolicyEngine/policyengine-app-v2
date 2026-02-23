import { IconSettings } from '@tabler/icons-react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui';

enum ValueSetterMode {
  DEFAULT = 'default',
  YEARLY = 'yearly',
  DATE = 'date',
  MULTI_YEAR = 'multi-year',
}

export { ValueSetterMode };

export function ModeSelectorButton(props: { setMode: (mode: ValueSetterMode) => void }) {
  const { setMode } = props;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Select value setter mode">
          <IconSettings />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => setMode(ValueSetterMode.DEFAULT)}>Default</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setMode(ValueSetterMode.YEARLY)}>Yearly</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setMode(ValueSetterMode.DATE)}>Advanced</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setMode(ValueSetterMode.MULTI_YEAR)}>Multi-year</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
