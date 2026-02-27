import { IconCheck } from '@tabler/icons-react';
import { Group, Stack, Text } from '@/components/ui';
import { colors, typography } from '@/designTokens';
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
            'tw:w-full tw:text-left tw:rounded-element tw:border tw:p-md tw:transition-all',
            card.isDisabled
              ? 'tw:opacity-60 tw:cursor-not-allowed tw:border-border-light tw:bg-gray-50 tw:pointer-events-none'
              : card.isSelected
                ? 'tw:border-primary-500 tw:bg-secondary-100 tw:cursor-pointer tw:hover:bg-secondary-200 tw:hover:border-primary-600'
                : 'tw:border-border-light tw:bg-white tw:cursor-pointer tw:hover:bg-gray-50 tw:hover:border-border-medium'
          )}
        >
          <Group gap="sm" className="tw:items-center">
            <div className="tw:w-5 tw:shrink-0" style={{ marginTop: '2px' }}>
              {card.isFulfilled && (
                <IconCheck
                  size={20}
                  style={{
                    color: colors.primary[600],
                  }}
                />
              )}
            </div>
            <Stack gap="xs" style={{ flex: 1 }}>
              <Text fw={typography.fontWeight.bold}>{card.title}</Text>
              <Text size="sm" style={{ color: colors.gray[600] }}>
                {card.description}
              </Text>
            </Stack>
          </Group>
        </button>
      ))}
    </Stack>
  );
}
