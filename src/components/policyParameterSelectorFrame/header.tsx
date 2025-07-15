import { Group, Text } from '@mantine/core';

export default function PolicyParameterSelectorHeader() {
  // TODO: Determine how to handle policy number
  return (
    <Group justify="space-between" align="center">
      <Text fw={700}>TODO: Cancel button</Text>
      <Text fw={700}>Policy #NUMBER</Text>
      <Text fw={700}>TODO: Next button</Text>
    </Group>
  );
}
