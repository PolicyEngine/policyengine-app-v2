import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import type { FlagshipReportRecord } from '@/api/flagshipReportStore';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useReformStore } from '@/hooks/useFlagshipStores';
import { useRunFlagshipReport } from '@/hooks/useRunFlagshipReport';
import { reformMissingParameters } from '@/libs/flagship/missingParameters';
import {
  baselineWithout,
  parametersWithout,
  provisionsWithout,
} from '@/libs/flagship/missingParameterTransfer';
import { readV1Policy } from '@/libs/flagship/policyChecks';
import { rerunSettings } from '@/libs/flagship/reportRerun';
import type { RootState } from '@/store';
import type { Reform } from '@/types/ingredients/Reform';

export const REFORM_TRANSFER_FAILED = 'Could not transfer the reform. Try again.';
export const REPORT_TRANSFER_FAILED = 'Could not transfer the report. Try again.';
const COMPARISON_CHANGES_NOTHING =
  'Without these parameters, the reform this report is compared with changes nothing, so the report cannot be transferred.';

/**
 * Moves one of the user's saved reforms onto a new policy without the
 * parameters the model no longer has. The store saves the other changes as
 * a v1 policy (`POST /{country}/policy`, which answers an identical one if
 * it exists) and repoints the reform to it, keeping its name, baseline and
 * provenance. The reforms are read again, so it no longer reads as blocked.
 */
export function useSavedReformTransfer() {
  const reformStore = useReformStore();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reform: Reform) =>
      reformStore.update(reform.id!, {
        parameters: parametersWithout(reform.parameters, reformMissingParameters(reform)),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reforms'] }),
  });
}

export interface SavedReportTransferOptions {
  /** This session's saved reform by its ID, to name the reform the report is compared with. */
  findReform?: (reformId: string) => Reform | null | undefined | Promise<Reform | null | undefined>;
  /** The run's title and source note: the report's own, or what the caller names it by. */
  title: string;
  sourceNote: string;
}

/**
 * Moves one of the user's saved reports onto new policies without the
 * parameters the model no longer has, and runs it again as Re-run does:
 * the same year, population, budget window and comparison. The saved
 * report itself is repointed at the new run, so it keeps its ID, and an
 * account report its link, which then opens the new results. Its links to
 * saved reforms stay as they are.
 */
export function useSavedReportTransfer() {
  const countryId = useCurrentCountry();
  const queryClient = useQueryClient();
  const runReport = useRunFlagshipReport();
  const parameters = useSelector((state: RootState) => state.metadata.parameters);
  const currentLawPolicyId =
    Number(useSelector((state: RootState) => state.metadata.currentLawId)) || undefined;
  const [transferring, setTransferring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Answers whether the run started; when it did not, the saved report is as it was. */
  const transfer = async (
    report: FlagshipReportRecord,
    missingParameters: string[],
    { findReform, title, sourceNote }: SavedReportTransferOptions
  ): Promise<boolean> => {
    setTransferring(true);
    setError(null);
    try {
      // The saved reform it is compared with, which names the comparison;
      // a lookup that fails leaves the comparison as its record has it.
      const comparisonReform = report.baselineReformId
        ? await Promise.resolve(findReform?.(report.baselineReformId)).catch(() => null)
        : null;
      const { year, baseline, ...runSettings } = await rerunSettings(countryId, report, {
        savedReform: (reformId) =>
          reformId === report.baselineReformId ? (comparisonReform ?? undefined) : undefined,
        currentLawPolicyId,
      });
      const transferredBaseline = baseline
        ? await baselineWithout(
            baseline,
            missingParameters,
            (policyId) => readV1Policy(queryClient, countryId, policyId),
            parameters
          )
        : undefined;
      if (transferredBaseline === null) {
        setError(COMPARISON_CHANGES_NOTHING);
        return false;
      }
      const link = await runReport.run(
        title,
        sourceNote,
        provisionsWithout(report.provisions, missingParameters),
        report.reformId,
        year,
        { ...runSettings, baseline: transferredBaseline, savedReportId: report.id }
      );
      if (!link) {
        setError(REPORT_TRANSFER_FAILED);
        return false;
      }
      return true;
    } catch {
      setError(REPORT_TRANSFER_FAILED);
      return false;
    } finally {
      setTransferring(false);
    }
  };

  return { transfer, transferring, error, clearError: () => setError(null) };
}
