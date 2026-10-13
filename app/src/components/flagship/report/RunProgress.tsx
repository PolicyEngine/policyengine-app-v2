import { useEffect, useState } from 'react';
import { Progress, Stack, Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { formatElapsed } from '@/libs/flagship/reportStages';

/** Milliseconds since the component mounted, ticking each second. */
function useElapsed(): number {
  const [started] = useState(() => Date.now());
  const [now, setNow] = useState(started);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return now - started;
}

/**
 * A society-wide run in progress, as a bar: what is running, how long it
 * has taken, and how far along a typical run of this size would be. The
 * API reports no stages for a single-year run, so the bar follows the
 * run's typical duration (the calculation strategy's estimate, held short
 * of the end until the results arrive).
 */
export default function RunProgress({
  title,
  progress,
  detail,
  expectedMs,
  note,
}: {
  /** e.g. "Calculating the nationwide results" */
  title: string;
  /** 0–100, from the calculation status; absent, the bar follows the clock. */
  progress?: number;
  /** One line under the title, e.g. a queue position. */
  detail?: string;
  /** How long a run like this one typically takes. */
  expectedMs: number;
  /** Extra copy under the bar, e.g. that later visits load from the cache. */
  note?: string;
}) {
  const elapsed = useElapsed();
  const value =
    typeof progress === 'number' ? progress : Math.min((elapsed / expectedMs) * 100, 95);
  const percent = Math.max(0, Math.min(Math.round(value), 99));

  return (
    <Stack
      role="status"
      aria-live="polite"
      style={{
        width: '100%',
        maxWidth: 640,
        gap: spacing.sm,
        padding: spacing.lg,
        border: `1px solid ${colors.border.light}`,
        borderRadius: 12,
        background: colors.background.primary,
      }}
    >
      <Stack style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.md }}>
        <Text
          style={{
            margin: 0,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            color: colors.text.primary,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            margin: 0,
            marginLeft: 'auto',
            fontSize: typography.fontSize.xs,
            color: colors.text.secondary,
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
          }}
        >
          {formatElapsed(elapsed)} · {percent}%
        </Text>
      </Stack>
      <Progress value={value} aria-label={`${title}, about ${percent}%`} className="tw:h-2" />
      {detail && (
        <Text style={{ margin: 0, fontSize: typography.fontSize.xs, color: colors.text.primary }}>
          {detail}
        </Text>
      )}
      {note && (
        <Text style={{ margin: 0, fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
          {note}
        </Text>
      )}
    </Stack>
  );
}
