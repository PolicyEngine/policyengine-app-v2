import { useQueryClient } from '@tanstack/react-query';
import { calculationKeys } from '@/libs/queryKeys';
import type { CalcStatus } from '@/types/calculation';
import { useUserReports, type EnhancedUserReport } from './useUserReports';

/**
 * Enhanced report with live calculation status
 * Extends EnhancedUserReport with real-time calculation data
 */
export interface ReportWithLiveStatus extends EnhancedUserReport {
  /**
   * Live status from calculation cache (if calculation is active)
   * Falls back to persisted report status
   */
  liveStatus: 'initializing' | 'computing' | 'complete' | 'error';

  /**
   * Whether calculation is currently active
   */
  isCalculating: boolean;

  /**
   * Live progress percentage (0-100) if calculation is active
   */
  progress?: number;

  /**
   * Live message if calculation is active
   */
  message?: string;

  /**
   * Queue position for economy calculations
   */
  queuePosition?: number;

  /**
   * Estimated time remaining for calculation
   */
  estimatedTimeRemaining?: number;
}

/**
 * Map CalcStatus status to Report status for display
 * Handles 5-state calculation status → 4-state report status mapping
 */
function mapCalcStatusToReportStatus(
  calcStatus: CalcStatus['status']
): 'initializing' | 'computing' | 'complete' | 'error' {
  switch (calcStatus) {
    case 'initializing':
    case 'idle':
      return 'initializing';
    case 'pending':
      return 'computing';
    case 'complete':
      return 'complete';
    case 'error':
      return 'error';
  }
}

/**
 * Enhanced hook that combines persisted report data with live calculation status
 *
 * WHY THIS EXISTS:
 * The Reports page needs to show real-time status for reports that are actively calculating.
 * However, useUserReports only reads database-persisted status, which is stale during calculations.
 *
 * This hook:
 * 1. Gets all user reports (database-persisted data)
 * 2. For each report, checks calculation cache for live status
 * 3. Prioritizes live calculation status over persisted status
 * 4. Falls back to persisted status for completed/idle reports
 *
 * BEHAVIOR:
 * - If report is actively calculating: Shows 'computing' + progress + message
 * - If report completed but cache not updated: Shows 'complete' from database
 * - If report is idle/new: Shows 'pending' from database
 * - If calculation errored: Shows 'error' + error details
 *
 * @param userId - User ID to fetch reports for
 * @returns Enhanced reports with live calculation status
 *
 * @example
 * // In Reports page
 * const { data: reports, isLoading } = useReportsWithLiveStatus(userId);
 *
 * reports.forEach(report => {
 *   console.log(report.liveStatus); // 'computing' if active, otherwise persisted status
 *   if (report.isCalculating) {
 *     console.log(`Progress: ${report.progress}%`);
 *     console.log(`Message: ${report.message}`);
 *   }
 * });
 */
export function useReportsWithLiveStatus(userId: string) {
  const queryClient = useQueryClient();

  // Get base reports data (database-persisted)
  const baseReports = useUserReports(userId);

  console.log('[useReportsWithLiveStatus] Base reports:', baseReports.data?.length);

  // Enhance each report with live calculation status
  const reportsWithLiveStatus: ReportWithLiveStatus[] | undefined = baseReports.data?.map(
    (report) => {
      const reportId = report.report?.id;

      if (!reportId) {
        // No report ID, return as-is with initializing status
        return {
          ...report,
          liveStatus: 'initializing' as const,
          isCalculating: false,
        };
      }

      // Check calculation cache for live status
      // For household reports: Check each simulation's calculation status
      // For economy reports: Check report-level calculation status
      let calcStatus: CalcStatus | undefined;

      const isHouseholdReport = report.simulations?.[0]?.populationType === 'household';

      if (isHouseholdReport) {
        // Household: Check simulation-level calculation status
        // Aggregate status from all simulations (similar to useAggregatedCalculationStatus)
        const simulationIds = report.simulations?.map(s => s.id).filter(Boolean) || [];

        // Check if ANY simulation is calculating
        const calculatingSimulation = simulationIds.find(simId => {
          const simCalcStatus = queryClient.getQueryData<CalcStatus>(
            calculationKeys.bySimulationId(simId!)
          );
          return simCalcStatus?.status === 'pending';
        });

        if (calculatingSimulation) {
          // Get status of calculating simulation
          calcStatus = queryClient.getQueryData<CalcStatus>(
            calculationKeys.bySimulationId(calculatingSimulation)
          );
        } else {
          // Check if all simulations are complete
          const allSimulationsStatuses = simulationIds.map(simId =>
            queryClient.getQueryData<CalcStatus>(
              calculationKeys.bySimulationId(simId!)
            )
          );

          const allComplete = allSimulationsStatuses.every(
            status => status?.status === 'complete'
          );

          if (allComplete && allSimulationsStatuses.length > 0) {
            // All simulations complete, use first one's status
            calcStatus = allSimulationsStatuses[0];
          }
        }
      } else {
        // Economy: Check report-level calculation status
        calcStatus = queryClient.getQueryData<CalcStatus>(
          calculationKeys.byReportId(reportId)
        );
      }

      console.log(`[useReportsWithLiveStatus] Report ${reportId}:`, {
        persistedStatus: report.report?.status,
        calcStatus: calcStatus?.status,
        isHousehold: isHouseholdReport,
      });

      // Determine if calculation is actively running
      // Don't count 'initializing' or 'idle' as active calculations
      const hasActiveLiveStatus =
        calcStatus &&
        calcStatus.status !== 'initializing' &&
        calcStatus.status !== 'idle';

      // Prioritize live status if available and active
      const liveStatus = hasActiveLiveStatus && calcStatus
        ? mapCalcStatusToReportStatus(calcStatus.status)
        : (report.report?.status as 'initializing' | 'computing' | 'complete' | 'error') || 'initializing';

      const isCalculating = calcStatus?.status === 'pending';

      return {
        ...report,
        liveStatus,
        isCalculating,
        progress: isCalculating ? calcStatus?.progress : undefined,
        message: isCalculating ? calcStatus?.message : undefined,
        queuePosition: isCalculating ? calcStatus?.queuePosition : undefined,
        estimatedTimeRemaining: isCalculating ? calcStatus?.estimatedTimeRemaining : undefined,
      };
    }
  );

  console.log('[useReportsWithLiveStatus] Enhanced reports:', reportsWithLiveStatus?.length);
  console.log(
    '[useReportsWithLiveStatus] Calculating reports:',
    reportsWithLiveStatus?.filter(r => r.isCalculating).length
  );

  return {
    ...baseReports,
    data: reportsWithLiveStatus,
  };
}
