import { Box, Button, Group, SimpleGrid } from '@mantine/core';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import PaginationControls, { PaginationConfig } from './PaginationControls';

export interface ButtonConfig {
  label: string;
  variant?: 'filled' | 'outline' | 'disabled' | 'default';
  onClick: () => void;
  isLoading?: boolean;
}

export type { PaginationConfig };

export interface MultiButtonFooterProps {
  buttons: ButtonConfig[];
  /** New layout: Cancel on left, Back/Next on right with responsive stacking */
  cancelAction?: {
    label: string;
    onClick: () => void;
  };
  backAction?: {
    label: string;
    onClick: () => void;
  };
  primaryAction?: {
    label: string;
    onClick: () => void;
    isLoading?: boolean;
    isDisabled?: boolean;
  };
  /** Pagination controls to show in the center */
  pagination?: PaginationConfig;
}

export default function MultiButtonFooter(props: MultiButtonFooterProps) {
  const { buttons, cancelAction, backAction, primaryAction, pagination } = props;

  // New layout: Grid with equal spacing - Cancel left, Pagination center, Back/Next right
  if (cancelAction || backAction || primaryAction) {
    return (
      <SimpleGrid cols={3} spacing="md">
        {/* Left side: Cancel button */}
        <Box style={{ display: 'flex', justifyContent: 'flex-start' }}>
          {cancelAction && (
            <Button
              variant="outline"
              onClick={cancelAction.onClick}
            >
              {cancelAction.label}
            </Button>
          )}
        </Box>

        {/* Center: Pagination controls (if provided) */}
        <Box style={{ display: 'flex', justifyContent: 'center' }}>
          {pagination && <PaginationControls pagination={pagination} />}
        </Box>

        {/* Right side: Back and Primary buttons */}
        <Box style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Group gap="sm" wrap="nowrap">
            {backAction && (
              <Button
                variant="outline"
                onClick={backAction.onClick}
                leftSection={<IconChevronLeft size={16} />}
              >
                {backAction.label}
              </Button>
            )}
            {primaryAction && (
              <Button
                variant="filled"
                onClick={primaryAction.onClick}
                loading={primaryAction.isLoading}
                disabled={primaryAction.isDisabled}
                rightSection={<IconChevronRight size={16} />}
              >
                {primaryAction.label}
              </Button>
            )}
          </Group>
        </Box>
      </SimpleGrid>
    );
  }

  // Legacy layout for backward compatibility
  if (buttons.length === 0) {
    return null;
  }

  return (
    <Group justify="flex-end" gap="sm">
      {buttons.map((button, index) => (
        <Button
          key={index}
          variant={button.variant === 'disabled' ? 'outline' : button.variant}
          disabled={button.variant === 'disabled'}
          onClick={button.onClick}
          loading={button.isLoading}
        >
          {button.label}
        </Button>
      ))}
    </Group>
  );
}
