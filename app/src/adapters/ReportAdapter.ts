import { Report } from '@/types/ingredients/Report';
import { ReportMetadata } from '@/types/metadata/reportMetadata';
import { convertJsonToReportOutput } from './conversionHelpers';

/**
 * Adapter for converting between Report and API formats
 */
export class ReportAdapter {
  /**
   * Maps API status values to Report status values
   * Handles both calculation statuses and report statuses
   */
  private static mapApiStatusToReportStatus(apiStatus: string): Report['status'] {
    const statusMap: Record<string, Report['status']> = {
      // Map deprecated API statuses to current Report statuses
      ok: 'complete',
      computing: 'pending',
      error: 'error',
      // As well as current API report statuses
      pending: 'pending',
      complete: 'complete',
    };
    return statusMap[apiStatus] || 'pending';
  }

  /**
   * Converts ReportMetadata from API GET response to Report type.
   *
   * @deprecated Use v2 analysis endpoints instead. V2 reports construct their
   * Report object from UserReport metadata. This remains for backward compatibility
   * with reports created before the v2 migration.
   */
  static fromMetadata(metadata: ReportMetadata): Report {
    // Convert simulation IDs from individual fields to array
    // Use String() to ensure IDs are strings, regardless of API response type
    const simulationIds = metadata.simulation_2_id
      ? [String(metadata.simulation_1_id), String(metadata.simulation_2_id)]
      : [String(metadata.simulation_1_id)];

    return {
      id: String(metadata.id),
      countryId: metadata.country_id,
      year: metadata.year,
      apiVersion: metadata.api_version,
      simulationIds,
      status: this.mapApiStatusToReportStatus(metadata.status),
      output: convertJsonToReportOutput(metadata.output) as any, // Can be economy or household output
    };
  }
}
