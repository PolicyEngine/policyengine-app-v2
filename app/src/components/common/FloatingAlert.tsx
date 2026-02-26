import { ReactNode } from 'react';
import { IconAlertTriangle, IconCheck, IconInfoCircle, IconX } from '@tabler/icons-react';
import { Alert } from '@mantine/core';
import { spacing } from '@/designTokens';

type AlertType = 'success' | 'info' | 'warning' | 'error';

const alertConfig: Record<AlertType, { icon: ReactNode; color: string }> = {
  success: { icon: <IconCheck size={16} />, color: 'teal' },
  info: { icon: <IconInfoCircle size={16} />, color: 'blue' },
  warning: { icon: <IconAlertTriangle size={16} />, color: 'yellow' },
  error: { icon: <IconX size={16} />, color: 'red' },
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
  const { icon, color } = alertConfig[type];

  return (
    <Alert
      icon={icon}
      color={color}
      variant="outline"
      withCloseButton
      onClose={onClose}
      style={{
        position: 'fixed',
        top: `calc(${spacing.appShell.header.height} + ${spacing.xl})`,
        right: spacing.xl,
        zIndex: 1000,
        maxWidth: 400,
      }}
    >
      {children}
    </Alert>
  );
}
