import { Menu, ActionIcon } from '@mantine/core';
import { IconDots } from '@tabler/icons-react';
import { MenuColumnConfig, IngredientRecord } from './types';

interface MenuColumnProps {
  config: MenuColumnConfig;
  record: IngredientRecord;
}

export function MenuColumn({ config, record }: MenuColumnProps) {
  return (
    <Menu shadow="md" width={200}>
      <Menu.Target>
        <ActionIcon variant="subtle" color="gray">
          <IconDots size={16} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        {config.actions.map((action) => (
          <Menu.Item 
            key={action.action}
            color={action.color}
            onClick={() => config.onAction(action.action, record.id)}
          >
            {action.label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}