import { Progress, Spinner, Stack, Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';

/**
 * The flagship report's single loading surface while the society-wide
 * run is in progress: one line of status, one thin bar, and a sentence
 * on what is coming. Sections that depend on the run (districts) render
 * a quiet placeholder rather than a second copy of the progress.
 */
export function ReportComputing({
  message,
  progress,
}: {
  message: string;
  /** 0–100, undefined until the calculation reports progress. */
  progress?: number;
}) {
  return (
    <Stack
      style={{
        gap: spacing.md,
        padding: spacing.xl,
        border: `1px solid ${colors.border.light}`,
        borderRadius: 12,
        background: colors.background.primary,
      }}
    >
      <Stack style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Spinner size="sm" />
        <Text
          style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            color: colors.text.primary,
          }}
        >
          {message}
        </Text>
        {typeof progress === 'number' && (
          <Text
            style={{
              marginLeft: 'auto',
              fontSize: typography.fontSize.xs,
              color: colors.text.secondary,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {Math.round(progress)}%
          </Text>
        )}
      </Stack>
      {typeof progress === 'number' && <Progress value={progress} className="tw:h-1.5" />}
      <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
        Budgetary impact, distribution by income decile, winners and losers, and poverty appear here
        when the run finishes, usually within a few minutes. The validation checks below run
        independently and are ready sooner.
      </Text>
    </Stack>
  );
}

/** A section that waits on the run, without repeating its progress. */
export function ReportWaiting({ what }: { what: string }) {
  return (
    <Text style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
      {what} follow once the nationwide run finishes.
    </Text>
  );
}

/** A link this browser cannot resolve: the report id belongs to another browser's local records. */
export function ReportUnresolvable() {
  return (
    <Stack
      style={{
        gap: spacing.sm,
        padding: spacing.xl,
        border: `1px solid ${colors.border.light}`,
        borderRadius: 12,
        background: colors.background.primary,
      }}
    >
      <Text
        style={{
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.medium,
          color: colors.text.primary,
        }}
      >
        This link only opens in the browser that ran the report.
      </Text>
      <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
        It carries a local report id. Reports run from now on carry a shareable id in their link;
        ask for the link again from the browser that created this one, or run the reform afresh from
        Build.
      </Text>
    </Stack>
  );
}
