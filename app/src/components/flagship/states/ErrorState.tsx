import { useState, type ReactNode } from 'react';
import { IconAlertTriangle } from '@tabler/icons-react';
import { Button } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';

interface ErrorStateProps {
  /** What failed, plainly: "Could not load the bill feed". */
  title: ReactNode;
  /** A second line, only when it helps the reader act. */
  description?: ReactNode;
  /**
   * Shows "Try again". When it returns a promise (a refetch), the button
   * stays busy until it settles, so a second click does not stack runs.
   */
  onRetry?: () => unknown;
  retryLabel?: string;
  /** More buttons after the retry, e.g. back to Build. */
  actions?: ReactNode;
  /** Under the buttons: a reference to hand on, technical details. */
  children?: ReactNode;
  /** Inside a card that has its own heading: no box, a smaller mark. */
  compact?: boolean;
}

const isThenable = (value: unknown): value is PromiseLike<unknown> =>
  !!value && typeof (value as PromiseLike<unknown>).then === 'function';

/**
 * A request that failed, said plainly, with a retry where one can help.
 * Every failed load in app v3 ends here rather than in a spinner that
 * never stops.
 */
export default function ErrorState({
  title,
  description,
  onRetry,
  retryLabel = 'Try again',
  actions,
  children,
  compact = false,
}: ErrorStateProps) {
  const [retrying, setRetrying] = useState(false);

  const retry = () => {
    const result = onRetry?.();
    if (isThenable(result)) {
      setRetrying(true);
      const done = () => setRetrying(false);
      result.then(done, done);
    }
  };

  const buttons = (onRetry || actions) && (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.sm }}>
      {onRetry && (
        <Button
          size={compact ? 'sm' : 'default'}
          variant={compact ? 'outline' : 'default'}
          onClick={retry}
          disabled={retrying}
          aria-busy={retrying || undefined}
        >
          {retrying ? 'Trying again…' : retryLabel}
        </Button>
      )}
      {actions}
    </div>
  );

  if (compact) {
    return (
      <div
        role="alert"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: spacing.sm,
          fontFamily: typography.fontFamily.primary,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing.sm }}>
          <IconAlertTriangle
            size={16}
            aria-hidden
            color={colors.text.warning}
            style={{ flexShrink: 0, marginTop: 2 }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
            <p style={{ margin: 0, fontSize: typography.fontSize.sm, color: colors.text.primary }}>
              {title}
            </p>
            {description && (
              <p
                style={{
                  margin: 0,
                  fontSize: typography.fontSize.xs,
                  color: colors.text.secondary,
                }}
              >
                {description}
              </p>
            )}
          </div>
        </div>
        {buttons}
        {children}
      </div>
    );
  }

  return (
    <section
      role="alert"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.md,
        maxWidth: 640,
        padding: spacing.xl,
        border: `1px solid ${colors.border.light}`,
        borderRadius: spacing.radius.feature,
        background: colors.background.primary,
        fontFamily: typography.fontFamily.primary,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing.md }}>
        <span
          aria-hidden
          style={{
            display: 'inline-flex',
            flexShrink: 0,
            padding: spacing.sm,
            borderRadius: 999,
            // The warning yellow, tinted.
            background: `${colors.warning}33`,
            color: colors.text.warning,
          }}
        >
          <IconAlertTriangle size={20} />
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
          <h2
            style={{
              margin: 0,
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
            }}
          >
            {title}
          </h2>
          {description && (
            <p
              style={{
                margin: 0,
                fontSize: typography.fontSize.sm,
                lineHeight: typography.lineHeight.relaxed,
                color: colors.text.secondary,
              }}
            >
              {description}
            </p>
          )}
        </div>
      </div>
      {buttons}
      {children}
    </section>
  );
}
