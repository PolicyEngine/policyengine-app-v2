import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { Button, Group, Spinner } from '@/components/ui';
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
      <div className="tw:flex tw:flex-wrap tw:justify-between tw:items-center tw:gap-md">
        {/* Left: Cancel */}
        <div className="tw:flex">
          {cancelAction && (
            <Button variant="outline" onClick={cancelAction.onClick}>
              {cancelAction.label}
            </Button>
          )}
        </div>

        {/* Center: Pagination (if provided) */}
        {pagination && (
          <div className="tw:flex tw:justify-center">
            <PaginationControls pagination={pagination} />
          </div>
        )}

        {/* Right: Back + Primary */}
        <div className="tw:flex tw:gap-sm">
          {backAction && (
            <Button variant="outline" onClick={backAction.onClick}>
              <IconChevronLeft size={16} />
              {backAction.label}
            </Button>
          )}
          {primaryAction && (
            <Button
              onClick={primaryAction.onClick}
              disabled={primaryAction.isDisabled || primaryAction.isLoading}
            >
              {primaryAction.isLoading && <Spinner size="sm" />}
              {primaryAction.label}
              <IconChevronRight size={16} />
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Legacy layout for backward compatibility
  if (buttons.length === 0) {
    return null;
  }

  return (
    <Group className="tw:justify-end" gap="sm">
      {buttons.map((button, index) => (
        <Button
          key={index}
          variant={button.variant === 'filled' ? 'default' : 'outline'}
          disabled={button.variant === 'disabled' || button.isLoading}
          onClick={button.onClick}
        >
          {button.isLoading && <Spinner size="sm" />}
          {button.label}
        </Button>
      ))}
    </Group>
  );
}
