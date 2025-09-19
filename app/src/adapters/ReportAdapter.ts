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
   * Converts ReportMetadata from API GET response to Report type
   * Handles snake_case to camelCase conversion
   */
  static fromMetadata(metadata: ReportMetadata): Report {
    // Convert simulation IDs from individual fields to array
    const simulationIds = metadata.simulation_2_id
      ? [metadata.simulation_1_id, metadata.simulation_2_id]
      : [metadata.simulation_1_id];

    return {
      reportId: String(metadata.id),
      countryId: metadata.country_id,
      apiVersion: metadata.api_version,
      simulationIds,
      status: metadata.status,
      output: convertJsonToReportOutput(metadata.output),
    };
  }

  /**
   * Converts Report to format for API POST request
   * API expects snake_case format - only simulation IDs needed for creation
   */
  static toCreationPayload(report: Report): ReportCreationPayload {
    // Extract simulation IDs from array
    const [simulation1Id, simulation2Id] = report.simulationIds;

    return {
      simulation_1_id: parseInt(simulation1Id, 10),
      simulation_2_id: simulation2Id ? parseInt(simulation2Id, 10) : null,
    };
  }

  /**
   * Creates payload for marking a report as completed with output
   */
  static toCompletedReportPayload(report: Report): ReportSetOutputPayload {
    if (!report.reportId) {
      throw new Error('Report ID is required to create completed report payload');
    }
    return {
      id: parseInt(report.reportId, 10),
      status: 'complete',
      output: convertReportOutputToJson(report.output),
    };
  }

  /**
   * Creates payload for marking a report as errored
   */
  static toErrorReportPayload(report: Report): ReportSetOutputPayload {
    if (!report.reportId) {
      throw new Error('Report ID is required to create error report payload');
    }
    return {
      id: parseInt(report.reportId, 10),
      status: 'error',
      output: null,
    };
  }
}
