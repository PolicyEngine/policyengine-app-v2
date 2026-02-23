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
      <div className="tw:grid tw:grid-cols-1 sm:tw:grid-cols-3 tw:gap-md">
        {/* Left side: Cancel button */}
        <div className="tw:flex tw:justify-start">
          {cancelAction && (
            <Button variant="outline" onClick={cancelAction.onClick} className="tw:w-full">
              {cancelAction.label}
            </Button>
          )}
        </div>

        {/* Center: Pagination controls (if provided) */}
        <div className="tw:flex tw:justify-center">
          {pagination && <PaginationControls pagination={pagination} />}
        </div>

        {/* Right side: Back and Primary buttons */}
        <div className="tw:flex tw:justify-end">
          <div className="tw:flex tw:gap-sm tw:flex-nowrap tw:w-full">
            {backAction && (
              <Button variant="outline" onClick={backAction.onClick} className="tw:w-full">
                <IconChevronLeft size={16} />
                {backAction.label}
              </Button>
            )}
            {primaryAction && (
              <Button
                onClick={primaryAction.onClick}
                disabled={primaryAction.isDisabled || primaryAction.isLoading}
                className="tw:w-full"
              >
                {primaryAction.isLoading && <Spinner size="sm" />}
                {primaryAction.label}
                <IconChevronRight size={16} />
              </Button>
            )}
          </div>
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
