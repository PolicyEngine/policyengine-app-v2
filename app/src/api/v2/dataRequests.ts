import { apiClient } from '../apiClient';

export interface DataRequest {
  description: string;
  report_id: string;
}

export interface ParsedAggregate {
  simulation_id: string;
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
  async parse(description: string, reportId: string): Promise<DataRequestResponse> {
    return apiClient.post<DataRequestResponse, DataRequest>('/data-requests/parse', {
      description,
      report_id: reportId,
    });
  }
}

export const dataRequestsAPI = new DataRequestsAPI();