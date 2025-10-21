import { IconChevronRight } from '@tabler/icons-react';
import { Card, Group, Stack, Text } from '@mantine/core';
import { spacing } from '@/designTokens';

export interface ButtonPanelCard {
  title: string;
  description: string;
  onClick: () => void;
  isSelected?: boolean;
  isDisabled?: boolean;
}

interface ButtonPanelVariantProps {
  cards?: ButtonPanelCard[];
}

export default function ButtonPanelVariant({ cards }: ButtonPanelVariantProps) {
  if (!cards) return null;

  return (
    <Stack>
      {cards.map((card: ButtonPanelCard, index: number) => (
        <Card
          key={index}
          withBorder
          component="button"
          onClick={card.onClick}
          disabled={card.isDisabled}
          variant={card.isSelected ? 'buttonPanel--active' : 'buttonPanel--inactive'}
        >
          <Group justify="space-between" align="center">
            <Stack gap={spacing.xs} style={{ flex: 1 }}>
              <Text fw={700}>{card.title}</Text>
              <Text size="sm" c="dimmed">
                {card.description}
              </Text>
            </Stack>
            <IconChevronRight
              size={20}
              style={{
                color: 'var(--mantine-color-gray-6)',
                marginTop: '2px',
                flexShrink: 0,
              }}
            />
          </Group>
        </Card>
      ))}
    </Stack>
  );
}
