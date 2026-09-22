import type { ReactNode } from 'react';
import { IconInfoCircle } from '@tabler/icons-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';

export default function ChartExplanation({
  children,
  compact = false,
}: {
  children: ReactNode;
  compact?: boolean;
}) {
  if (!compact) {
    return <>{children}</>;
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="About this chart"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: spacing.xs,
            background: 'transparent',
            border: 0,
            padding: 0,
            color: colors.text.secondary,
            fontSize: typography.fontSize.xs,
            cursor: 'help',
          }}
        >
          <IconInfoCircle size={14} /> About this chart
        </button>
      </TooltipTrigger>
      <TooltipContent style={{ maxWidth: '45ch' }}>{children}</TooltipContent>
    </Tooltip>
  );
}
