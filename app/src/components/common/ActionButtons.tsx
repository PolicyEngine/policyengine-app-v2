import React from 'react';
import {
  IconInfoCircle,
  IconNewSection,
  IconPencil,
  IconShare,
  IconStatusChange,
  IconTransfer,
} from '@tabler/icons-react';
import { ActionIcon, Button, Tooltip } from '@mantine/core';
import { colors, typography } from '@/designTokens';

export interface ActionButtonProps {
  label?: string;
  tooltip?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  color?: string;
  variant?: string;
  size?: string;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
}

interface ActionButtonBaseProps extends ActionButtonProps {
  icon: React.ComponentType<{ size: number }>;
  tooltip: string;
}

function ActionButtonBase({
  icon: Icon,
  tooltip,
  label,
  onClick,
  disabled,
  loading,
  color,
  variant = 'light',
  size = 'lg',
  tooltipPosition = 'bottom',
}: ActionButtonBaseProps) {
  const tooltipStyles = {
    tooltip: {
      backgroundColor: colors.gray[700],
      fontSize: typography.fontSize.xs,
    },
  };

  if (label) {
    return (
      <Tooltip label={tooltip} position={tooltipPosition} styles={tooltipStyles} withArrow>
        <Button
          variant={variant}
          color={color || 'teal'}
          leftSection={<Icon size={16} />}
          onClick={onClick}
          disabled={disabled}
          loading={loading}
        >
          {label}
        </Button>
      </Tooltip>
    );
  }

  return (
    <Tooltip label={tooltip} position={tooltipPosition} styles={tooltipStyles} withArrow>
      <ActionIcon
        variant={variant}
        color={color || 'gray'}
        size={size}
        aria-label={tooltip}
        onClick={onClick}
        disabled={disabled}
        loading={loading}
      >
        <Icon size={18} />
      </ActionIcon>
    </Tooltip>
  );
}

export function ViewButton({ tooltip: tooltipOverride, ...props }: ActionButtonProps) {
  return <ActionButtonBase icon={IconInfoCircle} tooltip={tooltipOverride || 'View'} {...props} />;
}

export function EditAndUpdateButton(props: ActionButtonProps) {
  return <ActionButtonBase icon={IconStatusChange} tooltip="Update" {...props} />;
}

export function EditAndSaveNewButton(props: ActionButtonProps) {
  return <ActionButtonBase icon={IconNewSection} tooltip="Save as new" {...props} />;
}

export function EditDefaultButton(props: ActionButtonProps) {
  return <ActionButtonBase icon={IconPencil} tooltip="Edit" {...props} />;
}

export function ShareButton(props: ActionButtonProps) {
  return <ActionButtonBase icon={IconShare} tooltip="Share" {...props} />;
}

export function SwapButton(props: ActionButtonProps) {
  return <ActionButtonBase icon={IconTransfer} tooltip="Swap" {...props} />;
}
