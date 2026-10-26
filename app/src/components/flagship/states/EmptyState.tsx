import type { ReactNode } from 'react';
import { colors, spacing, typography } from '@/designTokens';

interface EmptyStateProps {
  /** One short line: what there is none of. */
  title: ReactNode;
  /** A second line, only when the title cannot say it alone. */
  description?: ReactNode;
  /** A muted icon over the title. */
  icon?: ReactNode;
  /** The next step, usually one button. */
  action?: ReactNode;
  /** Inside a panel or under a search box: less padding. */
  compact?: boolean;
}

/**
 * Nothing to show yet, said in one line with the next step beside it,
 * in a dashed box that holds the place of what would be there.
 */
export default function EmptyState({
  title,
  description,
  icon,
  action,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: spacing.sm,
        padding: compact ? `${spacing.xl} ${spacing.lg}` : `${spacing['3xl']} ${spacing.xl}`,
        border: `1px dashed ${colors.border.medium}`,
        borderRadius: spacing.radius.feature,
        textAlign: 'center',
        fontFamily: typography.fontFamily.primary,
      }}
    >
      {icon && (
        <span aria-hidden style={{ display: 'inline-flex', color: colors.text.secondary }}>
          {icon}
        </span>
      )}
      <p
        style={{
          margin: 0,
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.medium,
          color: colors.text.primary,
        }}
      >
        {title}
      </p>
      {description && (
        <p style={{ margin: 0, fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
          {description}
        </p>
      )}
      {action && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: spacing.sm,
            marginTop: spacing.xs,
          }}
        >
          {action}
        </div>
      )}
    </div>
  );
}
