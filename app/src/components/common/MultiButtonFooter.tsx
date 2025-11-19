import { Button, Group } from '@mantine/core';
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

  // New layout: Cancel left, Back/Next right
  if (cancelAction || backAction || primaryAction) {
    return (
      <Group
        justify="space-between"
        wrap="wrap"
        gap="md"
        style={{
          flexDirection: 'row',
        }}
      >
        {/* Left side: Cancel button */}
        <Group gap="sm">
          {cancelAction && (
            <Button
              variant="outline"
              onClick={cancelAction.onClick}
            >
              {cancelAction.label}
            </Button>
          )}
        </Group>

        {/* Center: Pagination controls (if provided) */}
        {pagination && <PaginationControls pagination={pagination} />}

        {/* Right side: Back and Primary buttons */}
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
      </Group>
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
