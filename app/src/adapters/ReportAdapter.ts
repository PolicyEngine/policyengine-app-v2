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
   * Handles snake_case to camelCase conversion and number to string ID conversion
   */
  static fromMetadata(metadata: ReportMetadata): Report {
    // Convert simulation IDs from individual number fields to string array
    const simulationIds = metadata.simulation_2_id !== null
      ? [String(metadata.simulation_1_id), String(metadata.simulation_2_id)]
      : [String(metadata.simulation_1_id)];

    return {
      reportId: String(metadata.id), // Convert number ID to string for frontend use
      simulationIds,  // Now array of strings (converted from numbers)
      status: metadata.status,
      output: convertJsonToReportOutput(metadata.output),
      createdAt: metadata.created_at,
      updatedAt: metadata.updated_at,
    };
  }

  /**
   * Converts Report to format for API POST request
   * API expects snake_case format - simulation IDs as numbers
   */
  static toCreationPayload(report: Report): ReportCreationPayload {
    // Extract simulation IDs from string array and convert to numbers
    const [simulation1Id, simulation2Id] = report.simulationIds;

    return {
      simulation_1_id: Number(simulation1Id),  // Convert string to number
      simulation_2_id: simulation2Id ? Number(simulation2Id) : null,  // Convert string to number or null
    };
  }

  /**
   * Creates payload for marking a report as completed with output
   */
  static toCompletedReportPayload(output: ReportOutput): ReportSetOutputPayload {
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
