import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { calculationKeys } from '@/libs/queryKeys';
import type { CalcStatus } from '@/types/calculation';

/**
 * Hook to get display-only progress from CalcStatus for society-wide reports
 *
 * IMPORTANT: This is for DISPLAY ONLY, not for state decisions.
 * Use Report.status for state decisions (is complete? needs calc?)
 *
 * This hook returns progress percentage for progress bars.
 * If CalcStatus doesn't exist (e.g., after page refresh), returns 0.
 *
 * Closely mimics useSimulationProgressDisplay but for report-level calculations.
 */
export function useReportProgressDisplay(reportId: string | undefined) {
  const queries = useQueries({
    queries: [
      {
        queryKey: reportId
          ? calculationKeys.byReportId(reportId)
          : (['placeholder'] as const),
        queryFn: async (): Promise<CalcStatus | undefined> => undefined,
        enabled: false,
        staleTime: Infinity,
      },
    ],
  });

  const calcStatus = queries[0]?.data as CalcStatus | undefined;

  const { displayProgress, hasCalcStatus, message } = useMemo(() => {
    if (!calcStatus) {
      // No CalcStatus available (e.g., after refresh)
      return { displayProgress: 0, hasCalcStatus: false, message: undefined };
    }

    // Return the progress and message from the CalcStatus
    const progress = calcStatus.progress || 0;
    const statusMessage = calcStatus.message;

    console.log('[useReportProgressDisplay]', {
      reportId,
      status: calcStatus.status,
      progress,
      hasCalcStatus: true,
      message: statusMessage,
    });

    return { displayProgress: progress, hasCalcStatus: true, message: statusMessage };
  }, [calcStatus, reportId]);

  return { displayProgress, hasCalcStatus, message };
}
