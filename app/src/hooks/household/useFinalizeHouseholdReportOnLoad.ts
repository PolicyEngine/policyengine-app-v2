import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ResultPersister } from '@/libs/calculations/ResultPersister';
import type { Report } from '@/types/ingredients/Report';
import type { Simulation } from '@/types/ingredients/Simulation';

interface FinalizeHouseholdReportOnLoadParams {
  report: Report | undefined;
  simulations: Simulation[] | undefined;
}

interface FinalizeHouseholdReportOnLoadResult {
  finalizationError: Error | null;
  retryFinalization: () => void;
}

/**
 * Complete a household report whose simulations were durably saved before the
 * parent report could be finalized (for example, after a tab closed or a
 * transient report PATCH failure).
 */
export function useFinalizeHouseholdReportOnLoad({
  report,
  simulations,
}: FinalizeHouseholdReportOnLoadParams): FinalizeHouseholdReportOnLoadResult {
  const queryClient = useQueryClient();
  const persister = useMemo(() => new ResultPersister(queryClient), [queryClient]);
  const [finalizationError, setFinalizationError] = useState<Error | null>(null);

  const finalize = useCallback(async () => {
    if (!report || report.status !== 'pending' || !simulations?.length) {
      setFinalizationError(null);
      return;
    }

    setFinalizationError(null);
    try {
      await persister.finalizeHouseholdReport(report, simulations);
    } catch (error) {
      const finalizationFailure = error instanceof Error ? error : new Error(String(error));
      setFinalizationError(finalizationFailure);
      console.error(
        `[useFinalizeHouseholdReportOnLoad] Failed to finalize report ${report.id}:`,
        finalizationFailure
      );
    }
  }, [persister, report, simulations]);

  useEffect(() => {
    void finalize();
  }, [finalize]);

  const retryFinalization = useCallback(() => {
    void finalize();
  }, [finalize]);

  return { finalizationError, retryFinalization };
}
