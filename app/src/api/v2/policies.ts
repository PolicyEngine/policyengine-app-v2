import { apiClient, PaginationParams } from '../apiClient';
import { parametersAPI, ParameterValue, ParameterValueCreate } from '../parameters';

export interface PolicyResponse {
  id: string;
  name: string;
  description?: string;
  country?: string;
  created_at: string;
  updated_at: string;
}

export interface PolicyCreate {
  name: string;
  description?: string;
  country?: string;
}

export interface PolicyUpdate {
  name?: string;
  description?: string;
}

export interface PolicyWithParameters extends PolicyResponse {
  parameters: ParameterValue[];
}

class PoliciesAPI {
  async list(params?: PaginationParams): Promise<PolicyResponse[]> {
    return apiClient.get<PolicyResponse[]>('/policies/', { params });
  }

  async get(policyId: string): Promise<PolicyResponse> {
    return apiClient.get<PolicyResponse>(`/policies/${policyId}`);
  }

  async create(data: PolicyCreate): Promise<PolicyResponse> {
    return apiClient.post<PolicyResponse, PolicyCreate>('/policies/', data);
  }

  async update(policyId: string, data: PolicyUpdate): Promise<PolicyResponse> {
    return apiClient.patch<PolicyResponse, PolicyUpdate>(`/policies/${policyId}`, data);
  }

  async delete(policyId: string): Promise<void> {
    return apiClient.delete<void>(`/policies/${policyId}`);
  }

  // Extended methods with parameters
  async getWithParameters(policyId: string): Promise<PolicyWithParameters> {
    const [policy, parameters] = await Promise.all([
      this.get(policyId),
      parametersAPI.getParametersForPolicy(policyId),
    ]);

    return {
      ...policy,
      parameters,
    };
  }

  async createWithParameters(
    policyData: PolicyCreate,
    parameterValues: Omit<ParameterValueCreate, 'policy_id'>[]
  ): Promise<PolicyWithParameters> {
    // First create the policy
    const policy = await this.create(policyData);

    // Then create all parameter values
    const parameters = await Promise.all(
      parameterValues.map((pv) =>
        parametersAPI.createParameterValue({
          ...pv,
          policy_id: policy.id,
        })
      )
    );

    return {
      ...policy,
      parameters,
    };
  }

  async duplicatePolicy(sourcePolicyId: string, newName: string): Promise<PolicyWithParameters> {
    // Get the source policy with parameters
    const source = await this.getWithParameters(sourcePolicyId);

    // Create new policy with copied data
    const newPolicy = await this.create({
      name: newName,
      description: source.description,
      country: source.country,
    });

    // Copy all parameter values
    const parameters = await Promise.all(
      source.parameters.map((pv) =>
        parametersAPI.createParameterValue({
          parameter_id: pv.parameter_id,
          policy_id: newPolicy.id,
          value: pv.value,
          start_date: pv.start_date,
          end_date: pv.end_date,
        })
      )
    );

    return {
      ...newPolicy,
      parameters,
    };
  }
}

export const policiesAPI = new PoliciesAPI();
