import { useState } from 'react';
import { IconChevronDown } from '@tabler/icons-react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Group,
  Separator,
} from '@/components/ui';
import { colors, spacing } from '@/designTokens';
import { IngredientRecord, SplitMenuColumnConfig } from './types';

interface SplitMenuColumnProps {
  config: SplitMenuColumnConfig;
  record: IngredientRecord;
}

export function SplitMenuColumn({ config, record }: SplitMenuColumnProps) {
  const [opened, setOpened] = useState(false);

  // Use the first action as the primary action
  const primaryAction = config.actions[0];
  const secondaryActions = config.actions.slice(1);

  const handlePrimaryAction = () => {
    if (primaryAction) {
      config.onAction(primaryAction.action, record.id);
    }
  };

  const handleSecondaryAction = (action: string) => {
    config.onAction(action, record.id);
    setOpened(false);
  };

  return (
    <Group gap="xs" style={{ width: 'fit-content' }} className="tw:flex-nowrap tw:gap-0">
      {/* Primary Button */}
      <Button
        variant="outline"
        disabled
        size="sm"
        onClick={handlePrimaryAction}
        style={{
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
          borderRight: 'none',
          minWidth: 120,
          justifyContent: 'flex-start',
          paddingLeft: spacing.md,
          paddingRight: spacing.md,
        }}
      >
        {primaryAction?.label || 'Action'}
      </Button>

      {/* Dropdown Button */}
      <DropdownMenu open={opened} onOpenChange={setOpened}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            disabled
            size="sm"
            style={{
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
              borderLeft: `1px solid ${colors.border.light}`,
              paddingLeft: spacing.xs,
              paddingRight: spacing.xs,
              minWidth: 32,
            }}
          >
            <IconChevronDown
              size={14}
              style={{
                transform: opened ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 150ms ease',
              }}
            />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" style={{ minWidth: 152 }}>
          {/* Include primary action in dropdown as well */}
          <DropdownMenuItem
            onClick={() => handleSecondaryAction(primaryAction.action)}
            className={primaryAction.color === 'red' ? 'tw:text-red-500' : ''}
          >
            {primaryAction.label}
          </DropdownMenuItem>

          {secondaryActions.length > 0 && <Separator />}

          {/* Secondary actions */}
          {secondaryActions.map((action) => (
            <DropdownMenuItem
              key={action.action}
              className={action.color === 'red' ? 'tw:text-red-500' : ''}
              onClick={() => handleSecondaryAction(action.action)}
            >
              {action.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </Group>
  );
}
