import { useEffect, useRef, useState } from 'react';
import { Progress, Spinner, Stack, Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { formatElapsed } from '@/libs/flagship/reportStages';
import type { RunStage } from '@/types/calculation';

/**
 * Milliseconds since the run started — `startedAt` when known (a run begun
 * on another page), else since the component mounted — ticking each second.
 */
function useElapsed(startedAt?: number): number {
  const [mounted] = useState(() => Date.now());
  const started =
    typeof startedAt === 'number' && Number.isFinite(startedAt) && startedAt <= mounted
      ? startedAt
      : mounted;
  const [now, setNow] = useState(mounted);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return now - started;
}

/**
 * The bar by the clock alone: steady to 85% over the typical run, then
 * slowing toward 95%, so a run that takes longer still moves.
 */
export function clockProgress(elapsed: number, expectedMs: number): number {
  if (elapsed <= expectedMs) {
    return (elapsed / expectedMs) * 85;
  }
  return 85 + 10 * (1 - Math.exp(-(elapsed - expectedMs) / expectedMs));
}

/** The run's card. */
const CARD_STYLE: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  maxWidth: 640,
  gap: spacing.sm,
  padding: spacing.lg,
  border: `1px solid ${colors.border.light}`,
  borderRadius: 12,
  background: colors.background.primary,
};

/**
 * The wait before a run has a bar: the report and its status still
 * loading. A spinner, not a card, so nothing stands empty on the page
 * until the run's own card arrives.
 */
export function RunLoading({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: spacing.sm,
        padding: `${spacing['3xl']} 0`,
      }}
    >
      <Spinner size="md" aria-hidden />
      <Text style={{ margin: 0, fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
        {label}…
      </Text>
    </div>
  );
}

/** One line per stage the API reports; an unknown stage gets no line. */
export function runStageCaption(runStage?: RunStage): string | undefined {
  switch (runStage?.stage) {
    case 'queued':
      return 'Waiting for a worker';
    case 'loading_data':
      return 'Loading the data';
    case 'baseline':
      return 'Running current law';
    case 'reform':
      return 'Running the reform';
    case 'simulating':
      return runStage.segments
        ? `Running the regions, ${runStage.segments.completed} of ${runStage.segments.total} done`
        : 'Running the regions';
    case 'outputs':
      return 'Calculating the results';
    default:
      return undefined;
  }
}

/**
 * The bar's value: the time estimate, held inside the stage the API reports
 * (from where the stage starts to just before the next one), else the
 * estimate alone.
 */
export function runProgressValue(estimate: number, runStage?: RunStage): number {
  if (typeof runStage?.floor !== 'number' || typeof runStage.max !== 'number') {
    return estimate;
  }
  return Math.min(Math.max(estimate, runStage.floor), runStage.max);
}

/**
 * A society-wide run in progress, as a bar: what is running, how long it
 * has taken, and how far along it is. The bar follows the run's typical
 * duration (the calculation strategy's estimate, held short of the end
 * until the results arrive). When the API reports the run's stage, the
 * estimate is held inside that stage, and the stage names the line under
 * the title. The bar never moves backwards.
 */
export default function RunProgress({
  title,
  progress,
  runStage,
  detail,
  expectedMs,
  note,
  startedAt,
}: {
  /** e.g. "Calculating the nationwide results" */
  title: string;
  /** 0–100, from the calculation status; absent, the bar follows the clock. */
  progress?: number;
  /** The run's stage from the API, when it reports one. */
  runStage?: RunStage;
  /** One line under the title, e.g. a queue position. */
  detail?: string;
  /** How long a run like this one typically takes. */
  expectedMs: number;
  /** Extra copy under the bar, e.g. that later visits load from the cache. */
  note?: string;
  /**
   * When the run started (epoch ms), when known. A run started earlier, then
   * opened again, picks up where its clock is rather than at 0.
   */
  startedAt?: number;
}) {
  const elapsed = useElapsed(startedAt);
  const byClock = clockProgress(elapsed, expectedMs);
  // The calculation's own estimate restarts with the page; the run's clock does not.
  const estimate =
    typeof progress === 'number'
      ? typeof startedAt === 'number'
        ? Math.max(progress, byClock)
        : progress
      : byClock;
  // The highest value shown so far: a stage's range can start lower than an
  // earlier estimate (a queued run's path is not known yet).
  const shown = useRef(0);
  shown.current = Math.max(shown.current, runProgressValue(estimate, runStage));
  const value = shown.current;
  const percent = Math.max(0, Math.min(Math.round(value), 99));
  const line =
    detail ??
    runStageCaption(runStage) ??
    (elapsed > expectedMs ? 'Taking longer than usual; still calculating' : undefined);

  return (
    <Stack role="status" aria-live="polite" style={CARD_STYLE}>
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
      {line && (
        <Text style={{ margin: 0, fontSize: typography.fontSize.xs, color: colors.text.primary }}>
          {line}
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
