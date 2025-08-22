import { Report } from '@/types/ingredients/Report';

/**
 * Adapter for converting between Report and API formats
 * NOTE: This is a template implementation - modify as the Report structure evolves
 */
export class ReportAdapter {
  /**
   * Converts Report metadata from API GET response to Report type
   * Handles snake_case to camelCase conversion
   * NOTE: This is a placeholder - actual implementation will depend on API structure
   */
  static fromMetadata(metadata: any): Report {
    return {
      id: metadata.id || metadata.report_id,
      countryId: metadata.country_id,
      apiVersion: metadata.api_version,
      simulationId: metadata.simulation_id,
      reportData: metadata.report_data || {},
      reportHash: metadata.report_hash || '',
    };
  }
  
  /**
   * Converts Report to format for API POST request
   * API expects snake_case format
   * NOTE: This is a placeholder - actual implementation will depend on API structure
   */
  static toCreationPayload(report: Partial<Report>): ReportCreationPayload {
    return {
      simulation_id: report.simulationId,
      // Add other fields as the API evolves
    };
  }
}

export interface ReportCreationPayload {
  simulation_id?: number;
  // Add other fields as the API evolves
}