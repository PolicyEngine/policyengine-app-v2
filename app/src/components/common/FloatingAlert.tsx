import { ReactNode } from 'react';
import { IconAlertTriangle, IconCheck, IconInfoCircle, IconX } from '@tabler/icons-react';
import { Alert, AlertDescription } from '@/components/ui';
import { spacing } from '@/designTokens';

type AlertType = 'success' | 'info' | 'warning' | 'error';

const alertConfig: Record<AlertType, { icon: ReactNode; className: string }> = {
  success: { icon: <IconCheck size={16} />, className: 'tw:border-green-500 tw:text-green-700' },
  info: { icon: <IconInfoCircle size={16} />, className: 'tw:border-blue-500 tw:text-blue-700' },
  warning: {
    icon: <IconAlertTriangle size={16} />,
    className: 'tw:border-yellow-500 tw:text-yellow-700',
  },
  error: { icon: <IconX size={16} />, className: 'tw:border-red-500 tw:text-red-700' },
};

interface FloatingAlertProps {
  type?: AlertType;
  children: ReactNode;
  onClose: () => void;
}

/**
 * FloatingAlert - Fixed-position alert for temporary notifications
 *
 * Displays in top-right corner below the app header.
 * Used for clipboard copy confirmations, warnings, etc.
 */
export function FloatingAlert({ type = 'success', children, onClose }: FloatingAlertProps) {
  const { icon, className } = alertConfig[type];

  return (
    <Alert
      className={className}
      style={{
        position: 'fixed',
        top: `calc(${spacing.appShell.header.height} + ${spacing.xl})`,
        right: spacing.xl,
        zIndex: 1000,
        maxWidth: 400,
      }}
    >
      <div className="tw:flex tw:items-start tw:gap-sm">
        <span className="tw:flex-shrink-0 tw:mt-0.5">{icon}</span>
        <AlertDescription className="tw:flex-1">{children}</AlertDescription>
        <button
          type="button"
          onClick={onClose}
          className="tw:bg-transparent tw:border-none tw:cursor-pointer tw:p-0 tw:flex-shrink-0"
          aria-label="Close"
        >
          <IconX size={14} />
        </button>
      </div>
    </Alert>
  );
}
