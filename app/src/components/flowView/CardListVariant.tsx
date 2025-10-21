import { useState } from 'react';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { ActionIcon, Card, Group, Stack, Text } from '@mantine/core';
import { spacing } from '@/designTokens';

export interface CardListItem {
  title: string;
  subtitle?: string;
  onClick: () => void;
  isSelected?: boolean;
  isDisabled?: boolean;
}

interface CardListVariantProps {
  items?: CardListItem[];
  itemsPerPage?: number;
  showPagination?: boolean;
}

export default function CardListVariant({
  items,
  itemsPerPage = 5,
  showPagination = true,
}: CardListVariantProps) {
  const [currentPage, setCurrentPage] = useState(1);

  if (!items) return null;

  const allItems = items;
  const totalPages = Math.ceil(allItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = allItems.slice(startIndex, endIndex);
  const shouldShowPagination = showPagination && totalPages > 1;

  console.log('[CardListVariant] ========== PAGINATION ==========');
  console.log('[CardListVariant] Total items:', allItems.length);
  console.log('[CardListVariant] Items per page:', itemsPerPage);
  console.log('[CardListVariant] Total pages:', totalPages);
  console.log('[CardListVariant] Current page:', currentPage);
  console.log('[CardListVariant] Should show pagination:', shouldShowPagination);
  console.log('[CardListVariant] Paginated items count:', paginatedItems.length);

  return (
    <Stack gap={spacing.md}>
      {/* Pagination header */}
      {shouldShowPagination && (
        <Group justify="space-between" align="center">
          <Text size="sm" c="dimmed">
            Showing {startIndex + 1}-{Math.min(endIndex, allItems.length)} of {allItems.length}
          </Text>
          <Group gap="xs">
            <ActionIcon
              variant="default"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <IconChevronLeft size={18} />
            </ActionIcon>
            <Text size="sm">
              Page {currentPage} of {totalPages}
            </Text>
            <ActionIcon
              variant="default"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              <IconChevronRight size={18} />
            </ActionIcon>
          </Group>
        </Group>
      )}

      {/* Card list */}
      <Stack gap={spacing.sm}>
        {paginatedItems.map((item: CardListItem, index: number) => (
          <Card
            key={index}
            withBorder
            component="button"
            onClick={item.onClick}
            disabled={item.isDisabled}
            variant={item.isSelected ? 'cardList--active' : 'cardList--inactive'}
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
        ))}
      </Stack>
    </Stack>
  );
}
