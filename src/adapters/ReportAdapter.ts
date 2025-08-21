import { Report } from '@/types/ingredients';

/**
 * Adapter for converting between Report and API formats
 * NOTE: This is a template implementation - modify as the Report structure evolves
 */
export class ReportAdapter {
  /**
   * Converts Report metadata from API GET response to Report type
   * NOTE: This is a placeholder - actual implementation will depend on API structure
   */
  static fromMetadata(metadata: any): Report {
    return {
      id: metadata.id || metadata.report_id,
      country_id: metadata.country_id,
      api_version: metadata.api_version,
      simulation_id: metadata.simulation_id,
      report_data: metadata.report_data || {},
      report_hash: metadata.report_hash || '',
    };
  }
  
  /**
   * Converts Report to format for API POST request
   * NOTE: This is a placeholder - actual implementation will depend on API structure
   */
  static toCreationPayload(report: Partial<Report>): ReportCreationPayload {
    return {
      simulation_id: report.simulation_id,
      // Add other fields as the API evolves
    };
  }
}

export interface ReportCreationPayload {
  simulation_id?: number;
  // Add other fields as the API evolves
}