import { ActionIcon, Group, Text } from '@mantine/core';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

export interface PaginationConfig {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

interface PaginationControlsProps {
  pagination: PaginationConfig;
}

export default function PaginationControls({ pagination }: PaginationControlsProps) {
  if (pagination.totalPages <= 1) {
    return null;
  }

  return (
    <Group gap="xs" wrap="nowrap">
      <ActionIcon
        variant="default"
        onClick={() => pagination.onPageChange(Math.max(1, pagination.currentPage - 1))}
        disabled={pagination.currentPage === 1}
        aria-label="Previous page"
      >
        <IconChevronLeft size={18} />
      </ActionIcon>
      <Text size="sm">
        {pagination.currentPage} / {pagination.totalPages}
      </Text>
      <ActionIcon
        variant="default"
        onClick={() => pagination.onPageChange(Math.min(pagination.totalPages, pagination.currentPage + 1))}
        disabled={pagination.currentPage === pagination.totalPages}
        aria-label="Next page"
      >
        <IconChevronRight size={18} />
      </ActionIcon>
    </Group>
  );
}
