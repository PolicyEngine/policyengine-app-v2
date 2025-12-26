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
  if (!cards) {
    return null;
  }

  return (
    <Stack>
      {cards.map((card: ButtonPanelCard, index: number) => {
        // Determine variant based on selection and disabled state
        let variant = 'buttonPanel--inactive';
        if (card.isDisabled) {
          variant = 'buttonPanel--disabled';
        } else if (card.isSelected) {
          variant = 'buttonPanel--active';
        }

        return (
          <Card
            key={index}
            withBorder
            component="button"
            onClick={card.isDisabled ? undefined : card.onClick}
            disabled={card.isDisabled}
            variant={variant}
            style={{
              cursor: card.isDisabled ? 'not-allowed' : 'pointer',
              opacity: card.isDisabled ? 0.6 : 1,
            }}
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
                  color: card.isDisabled
                    ? 'var(--mantine-color-gray-4)'
                    : 'var(--mantine-color-gray-6)',
                  marginTop: '2px',
                  flexShrink: 0,
                }}
              />
            </Group>
          </Card>
        );
      })}
    </Stack>
  );
}
