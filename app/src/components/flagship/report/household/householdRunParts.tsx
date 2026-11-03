import type { CSSProperties } from 'react';
import RunProgress from '@/components/flagship/report/RunProgress';
import { ErrorState } from '@/components/flagship/states';
import { Button } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import type { ValidationResult } from '@/utils/HouseholdValidation';

/**
 * What v3's household calculations show around a run, in the report
 * section and the standalone household report alike: the Calculate
 * button, the run's progress and its failure.
 */

/** Both policies run at once; a household new to the Public API takes about three minutes. */
export const HOUSEHOLD_RUN_EXPECTED_MS = 3 * 60 * 1000;

/** Calculate, with the first reason the household cannot run beside it. */
export function HouseholdCalculateRow({
  onCalculate,
  disabled,
  validation,
  style,
}: {
  onCalculate: () => void;
  /** Disabled while running, while the household cannot run, or while its result is shown. */
  disabled: boolean;
  /** Whether the household can run, as the household builder checks it. */
  validation: ValidationResult;
  style?: CSSProperties;
}) {
  const reason = validation.isValid ? null : validation.errors[0]?.message;
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: spacing.md, ...style }}
    >
      <Button size="sm" onClick={onCalculate} disabled={disabled}>
        Calculate
      </Button>
      {reason && (
        <span style={{ fontSize: typography.fontSize.xs, color: colors.error }}>{reason}</span>
      )}
    </div>
  );
}

/** A household run on its way. */
export function HouseholdRunProgress() {
  return <RunProgress title="Calculating this household" expectedMs={HOUSEHOLD_RUN_EXPECTED_MS} />;
}

/** A household run that failed, with the Public API's reason and a way to try again. */
export function HouseholdRunFailure({
  error,
  onRetry,
}: {
  error: Error | null;
  onRetry: () => void;
}) {
  return (
    <ErrorState
      compact
      title="This household could not be calculated"
      description={
        // A Public API message can carry a long unbroken path.
        error?.message && <span style={{ overflowWrap: 'anywhere' }}>{error.message}</span>
      }
      onRetry={onRetry}
    />
  );
}
