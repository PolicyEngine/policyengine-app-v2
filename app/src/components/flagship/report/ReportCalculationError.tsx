import { useState } from 'react';
import { IconAlertTriangle, IconCheck, IconCopy } from '@tabler/icons-react';
import { Button } from '@/components/ui';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { describeCalculationError } from '@/libs/flagship/calculationError';

/**
 * A failed report, said plainly: what went wrong and what to do — try
 * again, or take the reform back to Build to edit — with the API's
 * reference and raw message kept for whoever debugs it.
 */
export default function ReportCalculationError({
  message,
  onEdit,
}: {
  message?: string | null;
  /** Puts the report's reform back in the draft; absent, Build opens blank. */
  onEdit?: () => void;
}) {
  const nav = useAppNavigate();
  const countryId = useCurrentCountry();
  const [copied, setCopied] = useState(false);
  const summary = describeCalculationError(message);

  const copyReference = async () => {
    if (!summary.reference) {
      return;
    }
    try {
      await navigator.clipboard.writeText(summary.reference);
      setCopied(true);
    } catch {
      // Clipboard access can be refused; the id stays visible to copy by hand.
    }
  };

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
            {summary.title}
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: typography.fontSize.sm,
              lineHeight: typography.lineHeight.relaxed,
              color: colors.text.secondary,
            }}
          >
            {summary.body}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.sm }}>
        {summary.retryable && <Button onClick={() => window.location.reload()}>Try again</Button>}
        <Button
          variant={summary.retryable ? 'outline' : 'default'}
          onClick={() => {
            onEdit?.();
            nav.push(`/${countryId}/build`);
          }}
        >
          {onEdit ? 'Edit the reform' : 'Back to Build'}
        </Button>
      </div>

      {summary.reference && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            fontSize: typography.fontSize.xs,
            color: colors.text.tertiary,
          }}
        >
          Reference
          <code
            style={{
              fontFamily: typography.fontFamily.mono,
              color: colors.text.secondary,
              wordBreak: 'break-all',
            }}
          >
            {summary.reference}
          </code>
          <button
            type="button"
            onClick={copyReference}
            aria-label={copied ? 'Reference copied' : 'Copy reference'}
            className="tw:cursor-pointer tw:hover:bg-gray-100"
            style={{
              display: 'inline-flex',
              padding: 2,
              border: 'none',
              borderRadius: spacing.radius.element,
              background: 'transparent',
              color: copied ? colors.primary[600] : colors.text.tertiary,
            }}
          >
            {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
          </button>
        </div>
      )}

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
          {summary.detail}
        </pre>
      </details>
    </section>
  );
}
