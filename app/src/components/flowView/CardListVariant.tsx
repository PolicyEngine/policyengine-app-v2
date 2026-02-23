import { Stack, Text } from '@/components/ui';
import { cn } from '@/lib/utils';

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
      {paginatedItems.map((item: CardListItem, index: number) => (
        <button
          key={item.id || index}
          onClick={item.isDisabled ? undefined : item.onClick}
          disabled={item.isDisabled}
          className={cn(
            'tw:w-full tw:text-left tw:rounded-element tw:border tw:p-md tw:transition-colors',
            item.isDisabled
              ? 'tw:opacity-60 tw:cursor-not-allowed tw:border-gray-200 tw:bg-gray-50'
              : item.isSelected
                ? 'tw:border-primary-500 tw:bg-primary-50 tw:cursor-pointer'
                : 'tw:border-gray-200 tw:bg-white tw:cursor-pointer hover:tw:border-primary-300',
          )}
        >
          <Stack gap="xs">
            <Text fw={600}>{item.title}</Text>
            {item.subtitle && (
              <Text size="sm" style={{ color: '#868e96' }}>
                {item.subtitle}
              </Text>
            )}
          </Stack>
        </button>
      ))}
    </Stack>
  );
}
