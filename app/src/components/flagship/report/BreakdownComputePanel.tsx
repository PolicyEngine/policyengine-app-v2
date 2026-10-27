import { Button, Progress, Stack, Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';

/**
 * Where a separate run for a report's areas stands: not sent yet, running,
 * some areas in and some failed, failed, or complete.
 */
export type BreakdownComputeStatus = 'idle' | 'computing' | 'partial' | 'error' | 'complete';

/** The panel's words, which each kind of area run gives. */
export interface BreakdownComputeCopy {
  /** Before the run: what it calculates and how long it takes. */
  intro: string;
  /** The button that sends the run. */
  computeLabel: string;
  /** The message while it runs. */
  computingMessage: string;
  /** The progress bar's accessible name, before ", about N%". */
  progressLabel: string;
  /** The message once it has failed. */
  errorMessage: string;
}

export interface BreakdownComputePanelProps {
  status: BreakdownComputeStatus;
  copy: BreakdownComputeCopy;
  /** False until the report's policies and year are known: the button is disabled. */
  canStart: boolean;
  onStart: () => void;
  /** Absent, a failed or partial run offers no Retry, e.g. when Retry would not change it. */
  onRetry?: () => void;
  /** 0–100 while computing. */
  progress?: number;
  /** The line under the bar while computing, e.g. a queue position. */
  detail?: string;
  /** While partial: what is in and what is not. */
  summary?: string;
  /** Why the run, or part of it, failed. */
  reason?: string;
  /** Off where the button sits elsewhere, e.g. in a section's header. */
  showStartButton?: boolean;
}

const SECONDARY_TEXT_STYLE: React.CSSProperties = {
  margin: 0,
  fontSize: typography.fontSize.sm,
  color: colors.text.secondary,
};

const DETAIL_TEXT_STYLE: React.CSSProperties = {
  ...SECONDARY_TEXT_STYLE,
  fontSize: typography.fontSize.xs,
};

/** The button that sends a report's area run; shown only before it is sent. */
export function BreakdownComputeButton({
  status,
  copy,
  canStart,
  onStart,
}: Pick<BreakdownComputePanelProps, 'status' | 'copy' | 'canStart' | 'onStart'>) {
  if (status !== 'idle') {
    return null;
  }
  return (
    <Button type="button" variant="outline" size="sm" onClick={onStart} disabled={!canStart}>
      {copy.computeLabel}
    </Button>
  );
}

function RetryButton({ onRetry }: { onRetry?: () => void }) {
  if (!onRetry) {
    return null;
  }
  return (
    <Button type="button" variant="outline" size="sm" onClick={onRetry}>
      Retry
    </Button>
  );
}

/**
 * Where a report has no area impacts yet, for a run that calculates them
 * separately: the button that sends the run, its progress, what is in and
 * what failed when only part of it is, or its error, with Retry. Shows
 * nothing once the impacts are in, for the maps to take its place.
 */
export default function BreakdownComputePanel({
  status,
  copy,
  canStart,
  onStart,
  onRetry,
  progress,
  detail,
  summary,
  reason,
  showStartButton = true,
}: BreakdownComputePanelProps) {
  if (status === 'complete') {
    return null;
  }

  if (status === 'computing') {
    const percent = Math.max(0, Math.min(Math.round(progress ?? 0), 99));
    return (
      <Stack role="status" aria-live="polite" style={{ gap: spacing.sm }}>
        <Text style={{ ...SECONDARY_TEXT_STYLE, color: colors.text.primary }}>
          {copy.computingMessage}
        </Text>
        <Progress value={progress ?? 0} aria-label={`${copy.progressLabel}, about ${percent}%`} />
        {detail && <Text style={DETAIL_TEXT_STYLE}>{detail}</Text>}
      </Stack>
    );
  }

  if (status === 'partial') {
    return (
      <Stack role="status" style={{ gap: spacing.sm, alignItems: 'flex-start' }}>
        {summary && (
          <Text style={{ ...SECONDARY_TEXT_STYLE, color: colors.text.primary }}>{summary}</Text>
        )}
        {reason && <Text style={DETAIL_TEXT_STYLE}>{reason}</Text>}
        <RetryButton onRetry={onRetry} />
      </Stack>
    );
  }

  if (status === 'error') {
    return (
      <Stack role="alert" style={{ gap: spacing.sm, alignItems: 'flex-start' }}>
        <Text style={{ ...SECONDARY_TEXT_STYLE, color: colors.text.primary }}>
          {copy.errorMessage}
        </Text>
        {reason && <Text style={DETAIL_TEXT_STYLE}>{reason}</Text>}
        <RetryButton onRetry={onRetry} />
      </Stack>
    );
  }

  return (
    <Stack style={{ gap: spacing.md, alignItems: 'flex-start' }}>
      <Text style={SECONDARY_TEXT_STYLE}>{copy.intro}</Text>
      {showStartButton && (
        <BreakdownComputeButton status={status} copy={copy} canStart={canStart} onStart={onStart} />
      )}
    </Stack>
  );
}
