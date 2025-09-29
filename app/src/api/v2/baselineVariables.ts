import { apiClient, PaginationParams } from '../apiClient';

export interface BaselineVariableTable {
  id: string; // This is the variable_name
  model_id: string;
  model_version_id: string;
  entity: string;
  label?: string | null;
  description?: string | null;
  data_type?: any | null;
}

export interface BaselineVariableFilters extends PaginationParams {
  variable_name?: string;
  model_id?: string;
}

class BaselineVariablesAPI {
  async list(params?: BaselineVariableFilters): Promise<BaselineVariableTable[]> {
    return apiClient.get<BaselineVariableTable[]>('/baseline-variables/', { params });
  }

  async get(baselineVariableId: string): Promise<BaselineVariableTable> {
    return apiClient.get<BaselineVariableTable>(`/baseline-variables/${baselineVariableId}`);
  }

  async create(data: BaselineVariableTable): Promise<BaselineVariableTable> {
    return apiClient.post<BaselineVariableTable, BaselineVariableTable>('/baseline-variables/', data);
  }

  async update(
    baselineVariableId: string,
    data: Partial<BaselineVariableTable>
  ): Promise<BaselineVariableTable> {
    return apiClient.patch<BaselineVariableTable, Partial<BaselineVariableTable>>(
      `/baseline-variables/${baselineVariableId}`,
      data
    );
  }

  async delete(baselineVariableId: string): Promise<void> {
    return apiClient.delete<void>(`/baseline-variables/${baselineVariableId}`);
  }
}

export const baselineVariablesAPI = new BaselineVariablesAPI();