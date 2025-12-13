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
    <Stack>
      {paginatedItems.map((item: CardListItem, index: number) => {
        const isSelected = item.isSelected;
        const isDisabled = item.isDisabled;

        return (
          <Card
            key={item.id || index}
            withBorder
            component="button"
            onClick={isDisabled ? undefined : item.onClick}
            disabled={isDisabled}
            style={{
              padding: spacing.sm,
              backgroundColor: isDisabled
                ? 'rgba(79, 209, 197, 0.02)'
                : isSelected
                  ? 'rgba(79, 209, 197, 0.1)'
                  : '#ffffff',
              border: isSelected
                ? '1px solid #4FD1C5'
                : '1px solid rgba(79, 209, 197, 0.2)',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              opacity: isDisabled ? 0.6 : 1,
              transition: 'all 0.2s ease',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => {
              if (!isDisabled) {
                e.currentTarget.style.borderColor = '#4FD1C5';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(79, 209, 197, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isDisabled) {
                e.currentTarget.style.borderColor = isSelected
                  ? '#4FD1C5'
                  : 'rgba(79, 209, 197, 0.2)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            <Stack gap={spacing.xs}>
              <Text fw={600} style={{ color: isSelected ? '#0d9488' : '#0d2b2a' }}>
                {item.title}
              </Text>
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
