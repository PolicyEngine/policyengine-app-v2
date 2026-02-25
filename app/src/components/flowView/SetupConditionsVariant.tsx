import { IconCheck } from '@tabler/icons-react';
import { Group, Stack, Text } from '@/components/ui';
import { colors } from '@/designTokens';
import { cn } from '@/lib/utils';

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
        <button
          type="button"
          key={index}
          onClick={card.onClick}
          disabled={card.isDisabled}
          className={cn(
            'tw:w-full tw:text-left tw:rounded-element tw:border tw:p-md tw:transition-colors',
            card.isDisabled
              ? 'tw:opacity-60 tw:cursor-not-allowed tw:border-gray-200 tw:bg-gray-50'
              : card.isSelected
                ? 'tw:border-primary-500 tw:bg-primary-50 tw:cursor-pointer'
                : card.isFulfilled
                  ? 'tw:border-green-300 tw:bg-green-50 tw:cursor-pointer'
                  : 'tw:border-gray-200 tw:bg-white tw:cursor-pointer tw:hover:border-primary-300'
          )}
        >
          <Group gap="sm" className="tw:items-center">
            {card.isFulfilled && (
              <IconCheck
                size={20}
                style={{
                  color: colors.primary[600],
                  marginTop: '2px',
                  flexShrink: 0,
                }}
              />
            )}
            <Stack gap="xs" style={{ flex: 1 }}>
              <Text fw={700}>{card.title}</Text>
              <Text size="sm" style={{ color: '#868e96' }}>
                {card.description}
              </Text>
            </Stack>
          </Group>
        </button>
      ))}
    </Stack>
  );
}
