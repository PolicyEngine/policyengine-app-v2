import { Card, Stack, Text } from '@mantine/core';
import { spacing } from '@/designTokens';

export interface CardListItem {
  id?: string; // Unique identifier for React key
  title: string;
  subtitle?: string;
  onClick: () => void;
  isSelected?: boolean;
  isDisabled?: boolean;
}

interface CardListVariantProps {
  items?: CardListItem[];
  itemsPerPage?: number;
  currentPage?: number;
}

export default function CardListVariant({
  items,
  itemsPerPage = 5,
  currentPage = 1,
}: CardListVariantProps) {
  if (!items) {
    return null;
  }

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = items.slice(startIndex, endIndex);

  return (
    <Stack gap={spacing.sm}>
      {paginatedItems.map((item: CardListItem, index: number) => {
        // Determine variant based on disabled state first, then selection
        let variant = 'cardList--inactive';
        if (item.isDisabled) {
          variant = 'cardList--disabled';
        } else if (item.isSelected) {
          variant = 'cardList--active';
        }

        return (
          <Card
            key={item.id || index}
            withBorder
            component="button"
            onClick={item.isDisabled ? undefined : item.onClick}
            disabled={item.isDisabled}
            variant={variant}
          >
            <Stack gap={spacing.xs}>
              <Text fw={600}>{item.title}</Text>
              {item.subtitle && (
                <Text size="sm" c="dimmed">
                  {item.subtitle}
                </Text>
              )}
            </Stack>
          </Card>
        );
      })}
    </Stack>
  );
}
