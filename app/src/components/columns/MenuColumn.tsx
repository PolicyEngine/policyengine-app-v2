import { IconDots } from '@tabler/icons-react';
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui';
import { IngredientRecord, MenuColumnConfig } from './types';

interface MenuColumnProps {
  config: MenuColumnConfig;
  record: IngredientRecord;
}

export function MenuColumn({ config, record }: MenuColumnProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <IconDots size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent style={{ width: 200 }}>
        {config.actions.map((action) => (
          <DropdownMenuItem
            key={action.action}
            onClick={() => config.onAction(action.action, record.id)}
            className={action.color === 'red' ? 'tw:text-red-500' : ''}
          >
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
