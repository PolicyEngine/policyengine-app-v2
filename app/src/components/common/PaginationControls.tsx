import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { Button, Group, Text } from '@/components/ui';

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
    <Group gap="xs" className="tw:flex-nowrap">
      <Button
        variant="outline"
        size="icon"
        onClick={() => pagination.onPageChange(Math.max(1, pagination.currentPage - 1))}
        disabled={pagination.currentPage === 1}
        aria-label="Previous page"
      >
        <IconChevronLeft size={18} />
      </Button>
      <Text size="sm">
        {pagination.currentPage} / {pagination.totalPages}
      </Text>
      <Button
        variant="outline"
        size="icon"
        onClick={() =>
          pagination.onPageChange(Math.min(pagination.totalPages, pagination.currentPage + 1))
        }
        disabled={pagination.currentPage === pagination.totalPages}
        aria-label="Next page"
      >
        <IconChevronRight size={18} />
      </Button>
    </Group>
  );
}
