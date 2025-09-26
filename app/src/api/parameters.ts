import { apiClient, PaginationParams } from './apiClient';

export interface Parameter {
  id: string;
  name: string;
  model_id?: string;
  description?: string;
  type: string;
  data_type?: string;
  category?: string;
  unit?: string;
  default_value?: number | string | boolean;
  created_at: string;
  updated_at: string;
}

export interface ParameterValue {
  id: string;
  parameter_id: string;
  policy_id: string;
  value: number | string | boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface BaselineParameterValue {
  id: string;
  parameter_id: string;
  value: number | string | boolean;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ParameterCreate {
  name: string;
  description?: string;
  type: string;
  category?: string;
  unit?: string;
  default_value?: number | string | boolean;
}

export interface ParameterValueCreate {
  parameter_id: string;
  policy_id: string;
  value: number | string | boolean;
  start_date?: string;
  end_date?: string;
}

export interface BaselineParameterValueCreate {
  parameter_id: string;
  value: number | string | boolean;
  start_date?: string;
  end_date?: string;
}

export interface ParameterValueUpdate {
  value?: number | string | boolean;
  start_date?: string;
  end_date?: string;
}

class ParametersAPI {
  // Parameters
  async listParameters(params?: PaginationParams): Promise<Parameter[]> {
    return apiClient.get<Parameter[]>('/parameters/', { params });
  }

  async getParameter(parameterId: string): Promise<Parameter> {
    return apiClient.get<Parameter>(`/parameters/${parameterId}`);
  }

  async createParameter(data: ParameterCreate): Promise<Parameter> {
    return apiClient.post<Parameter, ParameterCreate>('/parameters/', data);
  }

  // Parameter Values
  async listParameterValues(
    params?: PaginationParams & { policy_id?: string }
  ): Promise<ParameterValue[]> {
    return apiClient.get<ParameterValue[]>('/parameter-values/', { params });
  }

  async getParameterValue(parameterValueId: string): Promise<ParameterValue> {
    return apiClient.get<ParameterValue>(`/parameter-values/${parameterValueId}`);
  }

  async createParameterValue(data: ParameterValueCreate): Promise<ParameterValue> {
    return apiClient.post<ParameterValue, ParameterValueCreate>('/parameter-values/', data);
  }

  async updateParameterValue(
    parameterValueId: string,
    data: ParameterValueUpdate
  ): Promise<ParameterValue> {
    return apiClient.patch<ParameterValue, ParameterValueUpdate>(
      `/parameter-values/${parameterValueId}`,
      data
    );
  }

  async deleteParameterValue(parameterValueId: string): Promise<void> {
    return apiClient.delete<void>(`/parameter-values/${parameterValueId}`);
  }

  // Baseline Parameter Values
  async listBaselineParameterValues(
    params?: PaginationParams & { parameter_id?: string }
  ): Promise<BaselineParameterValue[]> {
    return apiClient.get<BaselineParameterValue[]>('/baseline-parameter-values/', { params });
  }

  async getBaselineParameterValue(baselineValueId: string): Promise<BaselineParameterValue> {
    return apiClient.get<BaselineParameterValue>(`/baseline-parameter-values/${baselineValueId}`);
  }

  async createBaselineParameterValue(
    data: BaselineParameterValueCreate
  ): Promise<BaselineParameterValue> {
    return apiClient.post<BaselineParameterValue, BaselineParameterValueCreate>(
      '/baseline-parameter-values/',
      data
    );
  }

  async deleteBaselineParameterValue(baselineValueId: string): Promise<void> {
    return apiClient.delete<void>(`/baseline-parameter-values/${baselineValueId}`);
  }

  // Helper methods for policy creation flow
  async getParametersForPolicy(policyId: string): Promise<ParameterValue[]> {
    return this.listParameterValues({ policy_id: policyId, limit: 1000 });
  }

  async getParameterWithBaseline(parameterId: string): Promise<{
    parameter: Parameter;
    baseline: BaselineParameterValue | null;
  }> {
    const [parameter, baselineValues] = await Promise.all([
      this.getParameter(parameterId),
      this.listBaselineParameterValues({ limit: 1000 }),
    ]);

    const baseline = baselineValues.find((bv) => bv.parameter_id === parameterId) || null;

    return { parameter, baseline };
  }

  async getAllParametersWithBaselines(): Promise<
    Array<{
      parameter: Parameter;
      baseline: BaselineParameterValue | null;
    }>
  > {
    const [parameters, baselineValues] = await Promise.all([
      this.listParameters({ limit: 1000 }),
      this.listBaselineParameterValues({ limit: 1000 }),
    ]);

    const baselineMap = new Map(baselineValues.map((bv) => [bv.parameter_id, bv]));

    return parameters.map((parameter) => ({
      parameter,
      baseline: baselineMap.get(parameter.id) || null,
    }));
  }
}

export const parametersAPI = new ParametersAPI();
