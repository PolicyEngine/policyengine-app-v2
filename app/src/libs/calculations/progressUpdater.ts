import { QueryClient } from '@tanstack/react-query';
import { HouseholdCalculationHandler } from './handlers/household';
import { CalculationStatusResponse } from './status';

/**
 * HouseholdProgressUpdater manages synthetic progress updates for household calculations.
 * It polls the handler for status and pushes updates to the TanStack Query cache,
 * triggering re-renders in components watching the calculation.
 */
export class HouseholdProgressUpdater {
  private intervals = new Map<string, NodeJS.Timeout>();

  constructor(private queryClient: QueryClient) {}

  /**
   * Start synthetic progress updates for a household calculation
   * @param reportId - The report ID to update progress for
   * @param handler - The household handler to get status from
   */
  startProgressUpdates(reportId: string, handler: HouseholdCalculationHandler): void {
    // Don't start duplicate intervals
    if (this.intervals.has(reportId)) {
      console.log('[HouseholdProgressUpdater] Progress updates already running for:', reportId);
      return;
    }

    console.log('[HouseholdProgressUpdater] Starting progress updates for:', reportId);

    const interval = setInterval(() => {
      // Get current status from handler (no side effects)
      const status = handler.getStatus(reportId);

      if (!status) {
        // Calculation was cleaned up, stop updates
        console.log('[HouseholdProgressUpdater] No status found, stopping updates for:', reportId);
        this.stopProgressUpdates(reportId);
        return;
      }

      // Push update to TanStack Query cache
      // This triggers re-renders in components watching this query
      this.queryClient.setQueryData(
        ['calculation', reportId],
        status as CalculationStatusResponse
      );

      // Stop updates when calculation completes
      if (status.status !== 'computing') {
        console.log(
          '[HouseholdProgressUpdater] Calculation completed, stopping updates for:',
          reportId
        );
        this.stopProgressUpdates(reportId);
      }
    }, 500); // Update every 500ms for smooth progress

    this.intervals.set(reportId, interval);
  }

  /**
   * Stop progress updates for a specific report
   */
  stopProgressUpdates(reportId: string): void {
    const interval = this.intervals.get(reportId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(reportId);
    }
  }

  /**
   * Stop all progress updates
   */
  stopAllUpdates(): void {
    for (const [reportId, interval] of this.intervals) {
      clearInterval(interval);
    }
    this.intervals.clear();
  }
}