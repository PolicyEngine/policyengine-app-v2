import { IconChevronRight } from '@tabler/icons-react';
import { Group, Stack, Text } from '@/components/ui';
import { colors, typography } from '@/designTokens';
import { cn } from '@/lib/utils';

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
      {cards.map((card: ButtonPanelCard, index: number) => (
        <button
          type="button"
          key={index}
          onClick={card.isDisabled ? undefined : card.onClick}
          disabled={card.isDisabled}
          className={cn(
            'tw:w-full tw:text-left tw:rounded-element tw:border tw:p-md tw:transition-all',
            card.isDisabled
              ? 'tw:opacity-60 tw:cursor-not-allowed tw:border-border-light tw:bg-gray-50'
              : card.isSelected
                ? 'tw:border-primary-500 tw:bg-secondary-100 tw:cursor-pointer tw:hover:bg-secondary-200 tw:hover:border-primary-600'
                : 'tw:border-border-light tw:bg-white tw:cursor-pointer tw:hover:bg-gray-50 tw:hover:border-border-medium'
          )}
        >
          <Group className="tw:justify-between tw:items-center">
            <Stack gap="xs" style={{ flex: 1 }}>
              <Text fw={typography.fontWeight.bold}>{card.title}</Text>
              <Text size="sm" style={{ color: colors.gray[600] }}>
                {card.description}
              </Text>
            </Stack>
            <IconChevronRight
              size={20}
              style={{
                color: card.isDisabled ? colors.gray[300] : colors.gray[600],
                marginTop: '2px',
                flexShrink: 0,
              }}
            />
          </Group>
        </button>
      ))}
    </Stack>
  );
}
