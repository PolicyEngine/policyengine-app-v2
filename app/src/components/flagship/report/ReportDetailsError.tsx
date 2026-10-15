import { ErrorState } from '@/components/flagship/states';
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
export default function ReportDetailsError({
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
    <ErrorState
      title="Could not read this report's saved details"
      description={
        newer
          ? 'A newer version of PolicyEngine saved them. Reload to update.'
          : 'They are damaged in this browser.'
      }
      // Only a newer version's details read after a reload.
      onRetry={newer ? () => window.location.reload() : undefined}
      retryLabel="Reload"
      actions={
        <>
          <Button variant={newer ? 'outline' : 'default'} onClick={onOpenWithout}>
            Open without saved details
          </Button>
          <Button variant="outline" onClick={() => nav.push(`/${countryId}/build`)}>
            Back to Build
          </Button>
        </>
      }
    >
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
    </ErrorState>
  );
}
