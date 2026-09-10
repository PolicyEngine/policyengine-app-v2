import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  CalibrationMatchSection,
  useCalibrationMatches,
} from '@/components/flagship/CalibrationMatches';
import EstimateValidation from '@/components/flagship/EstimateValidation';
import {
  ModelTrackRecordSection,
  useModelTrackRecord,
} from '@/components/flagship/ValidationPanel';
import { Stack, Text } from '@/components/ui';
import { MOCK_USER_ID } from '@/constants';
import { colors, spacing, typography } from '@/designTokens';
import { useReportValidationSnapshot } from '@/hooks/useReportValidationSnapshot';
import { isFlagshipShellEnabled } from '@/libs/featureFlags';
import { provisionsFromPolicy } from '@/libs/flagship/reportProvenance';
import type { RootState } from '@/store';
import type { Policy } from '@/types/ingredients/Policy';

interface ReportValidationSectionProps {
  countryId: string;
  /** The reform policy whose parameter changes the report scores. */
  reformPolicy: Policy | null | undefined;
  /** The report's population id, e.g. `us` or `state/ca`. */
  region: string | null | undefined;
  year?: string | null;
  /** Report id on api.policyengine.org; the pin key when the flagship store is on. */
  apiReportId?: string | number | null;
  label?: string | null;
  /** The report's budgetary impact, handed to the external-estimates check. */
  peEstimate?: number | null;
}

/**
 * The data checks behind a society-wide report, on the production report
 * page: how well the microdata is calibrated for the variables the reform
 * moves, and the scorecard's track record for the programs it reaches.
 * Both are read-only lookups against public routes and run on every view.
 * The external-estimates agent (an LLM run) and the pinned snapshot (the
 * flagship report store) stay behind the flagship shell flag.
 */
export default function ReportValidationSection({
  countryId,
  reformPolicy,
  region,
  year,
  apiReportId,
  label,
  peEstimate,
}: ReportValidationSectionProps) {
  const parameters = useSelector((state: RootState) => state.metadata.parameters);
  // The flag reads localStorage, so it settles after hydration to keep
  // the server and first client render identical.
  const [flagshipOn, setFlagshipOn] = useState(false);
  useEffect(() => {
    setFlagshipOn(isFlagshipShellEnabled());
  }, []);

  const provisions = useMemo(
    () => provisionsFromPolicy(reformPolicy, parameters, year ?? undefined),
    [reformPolicy, parameters, year]
  );
  const paths = useMemo(() => provisions.map((p) => p.path), [provisions]);

  const trackRecord = useModelTrackRecord(paths);
  const calibration = useCalibrationMatches(paths, region);
  const pin = useReportValidationSnapshot(
    MOCK_USER_ID,
    flagshipOn && apiReportId !== undefined && apiReportId !== null
      ? String(apiReportId)
      : undefined,
    {
      calibration,
      programs: trackRecord.resolved ? trackRecord.programs : undefined,
    }
  );

  if (paths.length === 0) {
    return null;
  }

  // Both checks settled with nothing to compare against: say so rather
  // than leave the heading over an empty block.
  const nothingTraced =
    calibration !== undefined &&
    calibration !== null &&
    calibration.reachedCount === 0 &&
    trackRecord.resolved &&
    trackRecord.programs.length === 0;

  return (
    <Stack gap="md">
      {nothingTraced ? (
        <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
          None of this reform&apos;s parameters is traced to a model variable in the dependency map,
          so there is no calibration or scorecard check to show.
        </Text>
      ) : (
        <>
          <CalibrationMatchSection matches={calibration} pin={pin} />
          <ModelTrackRecordSection trackRecord={trackRecord} />
        </>
      )}
      {flagshipOn && (
        <Stack
          style={{
            gap: spacing.sm,
            padding: spacing.lg,
            border: `1px solid ${colors.border.light}`,
            borderRadius: 12,
            alignItems: 'stretch',
          }}
        >
          <Text
            style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              color: colors.text.primary,
            }}
          >
            External checks for this reform
          </Text>
          <EstimateValidation
            request={{
              countryId,
              label: label || reformPolicy?.label || 'Reform',
              provisions,
              peEstimate: peEstimate ?? undefined,
              year: year ?? undefined,
            }}
          />
        </Stack>
      )}
    </Stack>
  );
}
