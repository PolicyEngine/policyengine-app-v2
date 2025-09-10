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
      reportId: metadata.report_id,
      simulationIds,
      status: metadata.status,
      output: convertJsonToReportOutput(metadata.output),
      createdAt: metadata.created_at,
      updatedAt: metadata.updated_at,
    };
  }

  /**
   * Converts Report to format for API POST request
   * API expects snake_case format
   */
  static toCreationPayload(report: Report): ReportCreationPayload {
    // Extract simulation IDs from array
    const [simulation1Id, simulation2Id] = report.simulationIds;

    return {
      report_id: report.reportId,
      simulation_1_id: simulation1Id,
      simulation_2_id: simulation2Id || null,
      status: report.status,
      created_at: report.createdAt,
      updated_at: report.updatedAt,
    };
  }

  /**
   * Creates payload for marking a report as completed with output
   */
  static toCompletedReportPayload(reportId: string, output: ReportOutput, updatedAt: string): ReportSetOutputPayload {
    return {
      report_id: reportId,
      status: 'complete',
      output: convertReportOutputToJson(output),
      updated_at: updatedAt,
    };
  }

  /**
   * Creates payload for marking a report as errored
   */
  static toErrorReportPayload(reportId: string, updatedAt: string): ReportSetOutputPayload {
    return {
      report_id: reportId,
      status: 'error',
      output: null,
      updated_at: updatedAt,
    };
  }
}
