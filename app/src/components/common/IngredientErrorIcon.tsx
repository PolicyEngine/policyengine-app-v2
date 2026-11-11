import { IconAlertTriangle } from '@tabler/icons-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { colors } from '@/designTokens';

interface IngredientErrorIconProps {
  message: string;
  size?: number;
}

export function IngredientErrorIcon({ message, size = 16 }: IngredientErrorIconProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          aria-label={message}
          className="tw:inline-flex tw:shrink-0 tw:items-center"
          style={{ color: colors.error }}
        >
          <IconAlertTriangle size={size} />
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom">{message}</TooltipContent>
    </Tooltip>
  );
}
