import { IconChevronRight } from '@tabler/icons-react';
import { Group, Stack, Text } from '@/components/ui';
import { cn } from '@/lib/utils';
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
      {cards.map((card: ButtonPanelCard, index: number) => (
        <button
          key={index}
          onClick={card.isDisabled ? undefined : card.onClick}
          disabled={card.isDisabled}
          className={cn(
            'tw:w-full tw:text-left tw:rounded-element tw:border tw:p-md tw:transition-colors',
            card.isDisabled
              ? 'tw:opacity-60 tw:cursor-not-allowed tw:border-gray-200 tw:bg-gray-50'
              : card.isSelected
                ? 'tw:border-primary-500 tw:bg-primary-50 tw:cursor-pointer'
                : 'tw:border-gray-200 tw:bg-white tw:cursor-pointer hover:tw:border-primary-300',
          )}
        >
          <Group className="tw:justify-between tw:items-center">
            <Stack gap="xs" style={{ flex: 1 }}>
              <Text fw={700}>{card.title}</Text>
              <Text size="sm" style={{ color: '#868e96' }}>
                {card.description}
              </Text>
            </Stack>
            <IconChevronRight
              size={20}
              style={{
                color: card.isDisabled ? '#ced4da' : '#868e96',
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
