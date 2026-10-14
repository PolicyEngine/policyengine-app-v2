import { IconAlertTriangle } from '@tabler/icons-react';
import { Button } from '@/components/ui';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import type { ReportSchemaError } from '@/libs/flagship/reportSchema';

/**
 * A report whose stored details (title, source note, provisions) can't
 * be read: saved by a newer version of the app, or damaged. The results
 * can still open without them, rebuilt from the report's policy.
 */
export default function ReportRecordError({
  error,
  onOpenWithout,
}: {
  error: ReportSchemaError;
  /** Opens the report without the stored details. */
  onOpenWithout: () => void;
}) {
  const nav = useAppNavigate();
  const countryId = useCurrentCountry();
  const newer = error.code === 'newer-version';

  return (
    <section
      role="alert"
      className="tw:flex tw:flex-col"
      style={{
        gap: spacing.md,
        maxWidth: 640,
        padding: spacing.xl,
        border: `1px solid ${colors.border.light}`,
        borderRadius: spacing.radius.feature,
        background: colors.background.primary,
        fontFamily: typography.fontFamily.primary,
      }}
    >
      <div className="tw:flex tw:items-start" style={{ gap: spacing.md }}>
        <span
          aria-hidden
          className="tw:inline-flex tw:shrink-0 tw:rounded-full"
          style={{
            padding: spacing.sm,
            // The warning yellow, tinted.
            background: `${colors.warning}33`,
            color: colors.text.warning,
          }}
        >
          <IconAlertTriangle size={20} />
        </span>
        <div className="tw:flex tw:flex-col" style={{ gap: spacing.xs }}>
          <h2
            style={{
              margin: 0,
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
            }}
          >
            This report's saved details can't be read
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: typography.fontSize.sm,
              lineHeight: typography.lineHeight.relaxed,
              color: colors.text.secondary,
            }}
          >
            {newer
              ? 'A newer version of PolicyEngine saved them. Reload to update.'
              : 'They are damaged in this browser.'}
          </p>
        </div>
      </div>

      <div className="tw:flex tw:flex-wrap" style={{ gap: spacing.sm }}>
        {newer && <Button onClick={() => window.location.reload()}>Reload</Button>}
        <Button variant={newer ? 'outline' : 'default'} onClick={onOpenWithout}>
          Open without saved details
        </Button>
        <Button variant="outline" onClick={() => nav.push(`/${countryId}/build`)}>
          Back to Build
        </Button>
      </div>

      <details>
        <summary
          className="tw:cursor-pointer"
          style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}
        >
          Technical details
        </summary>
        <pre
          style={{
            margin: `${spacing.sm} 0 0`,
            padding: spacing.sm,
            borderRadius: spacing.radius.element,
            background: colors.gray[50],
            fontSize: typography.fontSize.xs,
            fontFamily: typography.fontFamily.mono,
            color: colors.text.secondary,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {error.message}
        </pre>
      </details>
    </section>
  );
}
