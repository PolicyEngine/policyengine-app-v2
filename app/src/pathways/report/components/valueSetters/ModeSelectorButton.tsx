import { IconSettings } from '@tabler/icons-react';
import { ActionIcon, Menu } from '@mantine/core';

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
    <Menu>
      <Menu.Target>
        <ActionIcon aria-label="Select value setter mode" variant="default">
          <IconSettings />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item onClick={() => setMode(ValueSetterMode.DEFAULT)}>Default</Menu.Item>
        <Menu.Item onClick={() => setMode(ValueSetterMode.YEARLY)}>Yearly</Menu.Item>
        <Menu.Item onClick={() => setMode(ValueSetterMode.DATE)}>Advanced</Menu.Item>
        <Menu.Item onClick={() => setMode(ValueSetterMode.MULTI_YEAR)}>Multi-year</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
