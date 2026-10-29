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
import { readV1Policy, reportMissingParameters } from '@/libs/flagship/policyChecks';
import { rerunSettings } from '@/libs/flagship/reportRerun';
import type { RootState } from '@/store';
import type { Reform } from '@/types/ingredients/Reform';

const REFORM_TRANSFER_FAILED = 'Could not transfer the reform. Try again.';
const REPORT_TRANSFER_FAILED = 'Could not transfer the report. Try again.';
const REPORT_CHANGES_NOTHING =
  'Without the parameters the model no longer has, this report changes nothing, so there is nothing to transfer.';

/** Why a saved item was not transferred, as its dialog says it; the item is as it was. */
export class TransferError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TransferError';
  }
}

/** Why a report whose comparison would change nothing is not transferred. */
function comparisonChangesNothing(missingParameters: string[]): string {
  const them = missingParameters.length === 1 ? 'this parameter' : 'these parameters';
  return `Without ${them}, the reform this report is compared with changes nothing, so the report cannot be transferred.`;
}

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
  return useMutation<Reform, TransferError, Reform>({
    mutationFn: async (reform) => {
      try {
        return await reformStore.update(reform.id!, {
          parameters: parametersWithout(reform.parameters, reformMissingParameters(reform)),
        });
      } catch {
        throw new TransferError(REFORM_TRANSFER_FAILED);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reforms'] }),
  });
}

/** A saved report to transfer, and what its new run is called. */
export interface SavedReportTransfer {
  report: FlagshipReportRecord;
  /** The parameters its policies set that the model no longer has. */
  missingParameters: string[];
  /** This session's saved reform by its ID, to name the reform the report is compared with. */
  findReform?: (reformId: string) => Reform | null | undefined | Promise<Reform | null | undefined>;
  /** The run's title and source note: the report's own, or what the caller names it by. */
  title: string;
  sourceNote: string;
  /** The report link the page shows, when it is the report's own page. */
  currentLink?: string;
}

/**
 * Moves one of the user's saved reports onto new policies without the
 * parameters the model no longer has, and runs it again as Re-run does:
 * the same year, population, budget window and comparison. The saved
 * report itself is repointed at the new run, so it keeps its ID, and an
 * account report its link, which then opens the new results. Its links to
 * saved reforms stay as they are. Answers the report's link.
 */
export function useSavedReportTransfer() {
  const countryId = useCurrentCountry();
  const queryClient = useQueryClient();
  const runReport = useRunFlagshipReport();
  const parameters = useSelector((state: RootState) => state.metadata.parameters);
  const currentLawPolicyId =
    Number(useSelector((state: RootState) => state.metadata.currentLawId)) || undefined;

  return useMutation<string, TransferError, SavedReportTransfer>({
    mutationFn: async ({
      report,
      missingParameters,
      findReform,
      title,
      sourceNote,
      currentLink,
    }) => {
      let link: string | null;
      const readPolicy = (policyCountryId: string, policyId: string) =>
        readV1Policy(queryClient, policyCountryId, policyId);
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
          // The saved report's run is replaced: its year and population must be the ones it ran.
          requireRun: true,
        });
        // Read now, from every policy the report ran: the list the dialog
        // opened with leaves out a policy whose read failed. A policy that
        // cannot be read now stops the transfer.
        const removed = [
          ...new Set([
            ...missingParameters,
            ...(await reportMissingParameters(countryId, report.apiReportId, readPolicy, {
              requireEveryPolicy: true,
            })),
          ]),
        ];
        const provisions = provisionsWithout(report.provisions, removed);
        if (provisions.length === 0) {
          throw new TransferError(REPORT_CHANGES_NOTHING);
        }
        const transferredBaseline = baseline
          ? await baselineWithout(
              baseline,
              removed,
              (policyId) => readPolicy(countryId, policyId),
              parameters
            )
          : undefined;
        if (transferredBaseline === null) {
          throw new TransferError(comparisonChangesNothing(removed));
        }
        link = await runReport.run(title, sourceNote, provisions, report.reformId, year, {
          ...runSettings,
          baseline: transferredBaseline,
          savedReportId: report.id,
          currentLink,
        });
      } catch (error) {
        throw error instanceof TransferError ? error : new TransferError(REPORT_TRANSFER_FAILED);
      }
      if (!link) {
        throw new TransferError(REPORT_TRANSFER_FAILED);
      }
      return link;
    },
  });
}
