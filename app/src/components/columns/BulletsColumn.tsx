import { Badge, Group, Stack, Text } from '@/components/ui';
import { colors } from '@/designTokens';
import { BulletsColumnConfig, BulletsValue } from './types';

interface BulletsColumnProps {
  config: BulletsColumnConfig; // TODO: Use this to further build out
  value: BulletsValue;
}

export function BulletsColumn({ value }: BulletsColumnProps) {
  return (
    <Stack gap="xs">
      {value.items.map((item, idx) => (
        <Group key={idx} gap="xs" className="tw:flex-nowrap">
          <Text size="sm" c={colors.text.primary}>
            • {item.text}
          </Text>
          {item.badge && (
            <Badge variant="secondary" className="tw:text-xs">
              {typeof item.badge === 'number' ? `+${item.badge}` : item.badge}
            </Badge>
          )}
        </Group>
      ))}
    </Stack>
  );
}
