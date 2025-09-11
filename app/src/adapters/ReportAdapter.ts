import { Report, ReportOutput } from '@/types/ingredients/Report';
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
      reportId: metadata.id,
      simulationIds,
      status: metadata.status,
      output: convertJsonToReportOutput(metadata.output),
      createdAt: metadata.created_at,
      updatedAt: metadata.updated_at,
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
      simulation_1_id: simulation1Id,
      simulation_2_id: simulation2Id || null,
    };
  }

  /**
   * Creates payload for marking a report as completed with output
   */
  static toCompletedReportPayload(
    output: ReportOutput
  ): ReportSetOutputPayload {
    return {
      status: 'complete',
      output: convertReportOutputToJson(output),
    };
  }

  /**
   * Creates payload for marking a report as errored
   */
  static toErrorReportPayload(): ReportSetOutputPayload {
    return {
      status: 'error',
      output: null,
    };
  }
}
