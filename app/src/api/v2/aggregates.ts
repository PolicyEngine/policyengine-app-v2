import { apiClient, PaginationParams } from '../apiClient';

export interface AggregateTable {
  id?: string;
  simulation_id: string;
  entity: string;
  variable_name: string;
  year?: number | null;
  filter_variable_name?: string | null;
  filter_variable_value?: string | null;
  filter_variable_leq?: number | null;
  filter_variable_geq?: number | null;
  aggregate_function: string;
  reportelement_id?: string | null;
  value?: number | null;
  updated_at?: string;
  model_version?: string;
  is_latest_model_version?: boolean;
}

export interface AggregateFilters extends PaginationParams {
  simulation_id?: string;
  variable_name?: string;
  entity?: string;
  aggregate_function?: string;
  year?: number;
}

class AggregatesAPI {
  async list(params?: AggregateFilters): Promise<AggregateTable[]> {
    return apiClient.get<AggregateTable[]>('/aggregates/', { params });
  }

  async get(aggregateId: string): Promise<AggregateTable> {
    return apiClient.get<AggregateTable>(`/aggregates/${aggregateId}`);
  }

  async create(data: AggregateTable): Promise<AggregateTable> {
    return apiClient.post<AggregateTable, AggregateTable>('/aggregates/', data);
  }

  async createBulk(aggregates: AggregateTable[]): Promise<AggregateTable[]> {
    return apiClient.post<AggregateTable[], AggregateTable[]>('/aggregates/bulk', aggregates);
  }

  async getByReportElement(reportElementId: string): Promise<AggregateTable[]> {
    return apiClient.get<AggregateTable[]>(`/report-elements/${reportElementId}/aggregates`);
  }

  async update(aggregateId: string, data: Partial<AggregateTable>): Promise<AggregateTable> {
    return apiClient.patch<AggregateTable, Partial<AggregateTable>>(`/aggregates/${aggregateId}`, data);
  }

  async delete(aggregateId: string): Promise<void> {
    return apiClient.delete<void>(`/aggregates/${aggregateId}`);
  }
}

export const aggregatesAPI = new AggregatesAPI();