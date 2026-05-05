import { Report } from '@/types/ingredients/Report';
import { ReportMetadata } from '@/types/metadata/reportMetadata';
import { ReportCreationPayload } from '@/types/payloads/ReportCreationPayload';
import { ReportSetOutputPayload } from '@/types/payloads/ReportSetOutputPayload';
import { convertJsonToReportOutput, convertReportOutputToJson } from './conversionHelpers';

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
   * Converts ReportMetadata from API GET response to Report type
   * Handles snake_case to camelCase conversion
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

  /**
   * Converts Report to format for API POST request
   * API expects snake_case format - simulation IDs and year needed for creation
   */
  static toCreationPayload(report: Report): ReportCreationPayload {
    // Extract simulation IDs from array
    const [simulation1Id, simulation2Id] = report.simulationIds;

    return {
      simulation_1_id: parseInt(simulation1Id, 10),
      simulation_2_id: simulation2Id ? parseInt(simulation2Id, 10) : null,
      year: report.year,
    };
  }

  /**
   * Creates payload for marking a report as completed with output
   */
  static toCompletedReportPayload(report: Report): ReportSetOutputPayload {
    if (!report.id) {
      throw new Error('Report ID is required to create completed report payload');
    }
    return {
      id: parseInt(report.id, 10),
      status: 'complete',
      output: report.output ? convertReportOutputToJson(report.output as any) : null,
    };
  }

  /**
   * Creates payload for marking a report as errored
   */
  static toErrorReportPayload(report: Report, errorMessage?: string): ReportSetOutputPayload {
    if (!report.id) {
      throw new Error('Report ID is required to create error report payload');
    }
    const payload: ReportSetOutputPayload = {
      id: parseInt(report.id, 10),
      status: 'error',
      output: null,
    };
    if (errorMessage) {
      payload.error_message = errorMessage;
    }
    return payload;
  }
}
