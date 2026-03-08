import React from 'react';
import {
  IconInfoCircle,
  IconNewSection,
  IconPencil,
  IconShare,
  IconStatusChange,
  IconTransfer,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface ActionButtonProps {
  label?: string;
  tooltip?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
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
  tooltipPosition = 'bottom',
}: ActionButtonBaseProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {label ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={onClick}
            disabled={disabled}
          >
            <Icon size={16} />
            {label}
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClick}
            disabled={disabled}
            aria-label={tooltip}
          >
            <Icon size={18} />
          </Button>
        )}
      </TooltipTrigger>
      <TooltipContent side={tooltipPosition}>{tooltip}</TooltipContent>
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
