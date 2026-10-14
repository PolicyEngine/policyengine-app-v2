import type { ReactNode } from 'react';
import {
  CalibrationMatchSection,
  type CalibrationPin,
} from '@/components/flagship/CalibrationMatches';
import {
  RelatedReformEstimates,
  ScorecardCoverage,
  splitScorecardRows,
  useScorecardComparisons,
  type ScorecardComparisonsState,
} from '@/components/flagship/ScorecardComparisons';
import {
  ValidationCard,
  ValidationLoading,
  ValidationNote,
} from '@/components/flagship/ValidationDisplay';
import { BaselineComparisons, type ModelTrackRecord } from '@/components/flagship/ValidationPanel';
import { Stack } from '@/components/ui';
import { spacing } from '@/designTokens';
import type { CalibrationMatches } from '@/libs/flagship/calibrationMatching';

export interface ReportValidationProps {
  countryId: string;
  /** The reform's parameter paths, to match against the scorecard. */
  paths: string[];
  calibration: CalibrationMatches | null | undefined;
  calibrationPin?: CalibrationPin;
  trackRecord: ModelTrackRecord;
  /** The report's own external estimates, e.g. a bill's fiscal note and third-party scores. */
  externalEstimates?: ReactNode;
  /** A line under the external estimates, e.g. where the bill's estimate came from. */
  externalEstimatesNote?: ReactNode;
}

/**
 * How this reform's estimate compares with outside scores: the report's
 * own (a bill's fiscal note), then published scores of related reforms.
 * Without either, one plain line says so.
 */
function ExternalEstimates({
  estimates,
  note,
  scorecard,
}: {
  estimates?: ReactNode;
  note?: ReactNode;
  scorecard: ScorecardComparisonsState;
}) {
  const { reforms } = splitScorecardRows(scorecard);
  let fallback: ReactNode = null;
  if (!estimates && reforms.length === 0) {
    fallback =
      scorecard === undefined ? (
        <ValidationLoading>Loading external estimates…</ValidationLoading>
      ) : scorecard === null ? (
        <ValidationNote>External estimates are temporarily unavailable.</ValidationNote>
      ) : (
        <ValidationNote>No external estimate is available for this reform.</ValidationNote>
      );
  }
  return (
    <ValidationCard id="external-estimates" title="External estimates">
      {estimates}
      {fallback}
      {note}
      {reforms.length > 0 && <RelatedReformEstimates rows={reforms} />}
      {scorecard && (scorecard.built || scorecard.unmappedCount > 0) && (
        <ScorecardCoverage result={scorecard} />
      )}
    </ValidationCard>
  );
}

/**
 * A report's validation, the same for every report: its estimate
 * against outside scores, then the model's baseline against the
 * official totals it is calibrated to and the published measures the
 * scorecard tracks.
 */
export default function ReportValidation({
  countryId,
  paths,
  calibration,
  calibrationPin,
  trackRecord,
  externalEstimates,
  externalEstimatesNote,
}: ReportValidationProps) {
  const scorecard = useScorecardComparisons(countryId, paths);
  const { baseline } = splitScorecardRows(scorecard);
  return (
    <Stack style={{ gap: spacing.xl }}>
      <ExternalEstimates
        estimates={externalEstimates}
        note={externalEstimatesNote}
        scorecard={scorecard}
      />
      <CalibrationMatchSection matches={calibration} pin={calibrationPin} />
      <BaselineComparisons
        trackRecord={trackRecord}
        scorecardRows={scorecard === undefined ? undefined : scorecard === null ? null : baseline}
      />
    </Stack>
  );
}
