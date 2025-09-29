import { apiClient } from '../apiClient';

export interface DataRequest {
  description: string;
  report_id: string;
  simulation_ids?: string[];
  is_comparison?: boolean;
}

export interface ParsedAggregate {
  simulation_id?: string;
  baseline_simulation_id?: string;
  comparison_simulation_id?: string;
  entity: string;
  variable_name: string;
  aggregate_function: string;
  year?: number | null;
  filter_variable_name?: string | null;
  filter_variable_value?: string | null;
  filter_variable_leq?: number | null;
  filter_variable_geq?: number | null;
}

export interface DataRequestResponse {
  aggregates: ParsedAggregate[];
  chart_type: string;
  x_axis_variable?: string | null;
  y_axis_variable?: string | null;
  explanation: string;
}

class DataRequestsAPI {
  async parse(
    description: string,
    reportId: string,
    simulationIds?: string[],
    isComparison?: boolean
  ): Promise<DataRequestResponse> {
    return apiClient.post<DataRequestResponse, DataRequest>('/data-requests/parse', {
      description,
      report_id: reportId,
      simulation_ids: simulationIds,
      is_comparison: isComparison,
    });
  }
}

export const dataRequestsAPI = new DataRequestsAPI();