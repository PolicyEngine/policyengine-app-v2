import { IconCheck } from '@tabler/icons-react';
import { Card, Group, Stack, Text } from '@mantine/core';
import { spacing } from '@/designTokens';

export interface SetupConditionCard {
  title: string;
  description: string;
  onClick: () => void;
  isSelected?: boolean;
  isDisabled?: boolean;
  isFulfilled?: boolean;
}

interface SetupConditionsVariantProps {
  cards?: SetupConditionCard[];
}

export default function SetupConditionsVariant({ cards }: SetupConditionsVariantProps) {
  if (!cards) {
    return null;
  }

  return (
    <Stack>
      {cards.map((card: SetupConditionCard, index: number) => (
        <Card
          key={index}
          withBorder
          component="button"
          onClick={card.onClick}
          disabled={card.isDisabled}
          variant={
            card.isDisabled
              ? 'setupCondition--disabled'
              : card.isSelected
                ? 'setupCondition--active'
                : card.isFulfilled
                  ? 'setupCondition--fulfilled'
                  : 'setupCondition--unfulfilled'
          }
        >
          <Group gap={spacing.sm} align="center">
            {card.isFulfilled && (
              <IconCheck
                size={20}
                style={{
                  color: 'var(--mantine-color-primary-6)',
                  marginTop: '2px',
                  flexShrink: 0,
                }}
              />
            )}
            <Stack gap={spacing.xs} style={{ flex: 1 }}>
              <Text fw={700}>{card.title}</Text>
              <Text size="sm" c="dimmed">
                {card.description}
              </Text>
            </Stack>
          </Group>
        </Card>
      ))}
    </Stack>
  );
}
