import { QueryClient } from '@tanstack/react-query';
import { reportKeys } from '@/libs/queryKeys';
import type { CalcStatus } from '@/types/calculation';

/**
 * Handles post-completion cache invalidation for calculations
 *
 * In v2, analysis endpoints persist all results server-side (simulations,
 * reports, and computed outputs are stored in the database by the API).
 * This class only invalidates React Query caches so the UI reflects
 * the completed state.
 */
export class ResultPersister {
  constructor(private queryClient: QueryClient) {}

  /**
   * Handle post-completion cache updates
   *
   * V2 analysis endpoints handle all persistence server-side.
   * This method invalidates relevant caches so UI components
   * that read report metadata get fresh data.
   *
   * @param status - The completed calculation status with result
   * @param _countryId - Unused in v2 (kept for CalcOrchestrator interface compatibility)
   * @param _year - Unused in v2 (kept for CalcOrchestrator interface compatibility)
   */
  async persist(status: CalcStatus, _countryId: string, _year: string): Promise<void> {
    if (!status.result) {
      throw new Error('Cannot persist: result is missing from CalcStatus');
    }

    // V2 analysis responses include report_id — invalidate report cache
    // so any UI reading report metadata gets the updated completion status
    const reportId = this.extractReportId(status.result);
    if (reportId) {
      this.queryClient.invalidateQueries({
        queryKey: reportKeys.byId(reportId),
      });
    }
  }

  /**
   * Extract report_id from a v2 analysis response
   * Both EconomicImpactResponse and HouseholdImpactResponse have report_id
   */
  private extractReportId(result: unknown): string | null {
    if (result && typeof result === 'object' && 'report_id' in result) {
      return String((result as Record<string, unknown>).report_id);
    }
    return null;
  }
}
