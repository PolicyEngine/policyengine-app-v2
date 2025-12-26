import { Badge, Group, Stack, Text } from '@mantine/core';
import { colors, spacing } from '@/designTokens';
import { BulletsColumnConfig, BulletsValue } from './types';

interface BulletsColumnProps {
  config: BulletsColumnConfig; // TODO: Use this to further build out
  value: BulletsValue;
}

// TODO: This is probably better described as "pills"
export function BulletsColumn({ value }: BulletsColumnProps) {
  return (
    <Stack gap={spacing.xs}>
      {value.items.map((item, idx) => (
        <Group key={idx} gap={spacing.xs}>
          <Text size="xs" c={colors.text.secondary}>
            •
          </Text>
          <Text size="xs" c={colors.text.secondary}>
            {item.text}
          </Text>
          {item.badge && (
            <Badge size="xs" variant="light" color="gray" radius={spacing.radius.sm}>
              {typeof item.badge === 'number' ? `+${item.badge}` : item.badge}
            </Badge>
          )}
        </Group>
      ))}
    </Stack>
  );
}
