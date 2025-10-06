import { apiClient, PaginationParams } from '../apiClient';

export interface SimulationResponse {
  id: string;
  name?: string;
  description?: string;
  policy_id: string;
  dataset_id?: string;
  model_id?: string;
  model_version_id?: string;
  has_result: boolean;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
  created_at: string;
  updated_at: string;
}

export interface SimulationCreate {
  name?: string;
  description?: string;
  policy_id: string;
  dataset_id?: string;
  model_id?: string;
  model_version_id?: string;
}

export interface SimulationUpdate {
  name?: string;
  description?: string;
  status?: 'pending' | 'running' | 'completed' | 'failed';
  results?: any;
  error?: string;
}

export interface SimulationRunResult {
  status: 'started' | 'already_running' | 'completed';
  simulation_id: string;
  results?: any;
}

class SimulationsAPI {
  async list(params?: PaginationParams): Promise<SimulationResponse[]> {
    return apiClient.get<SimulationResponse[]>('/simulations/', { params });
  }

  async get(simulationId: string): Promise<SimulationResponse> {
    return apiClient.get<SimulationResponse>(`/simulations/${simulationId}`);
  }

  async create(data: SimulationCreate): Promise<SimulationResponse> {
    return apiClient.post<SimulationResponse, SimulationCreate>('/simulations/', data);
  }

  async update(simulationId: string, data: SimulationUpdate): Promise<SimulationResponse> {
    return apiClient.patch<SimulationResponse, SimulationUpdate>(
      `/simulations/${simulationId}`,
      data
    );
  }

  async delete(simulationId: string): Promise<void> {
    return apiClient.delete<void>(`/simulations/${simulationId}`);
  }

  async run(simulationId: string): Promise<SimulationRunResult> {
    return apiClient.post<SimulationRunResult>(`/simulations/${simulationId}/run`);
  }

  // Helper methods
  async createAndRun(data: SimulationCreate): Promise<SimulationResponse> {
    const simulation = await this.create(data);
    await this.run(simulation.id);
    return this.waitForCompletion(simulation.id);
  }

  async waitForCompletion(
    simulationId: string,
    maxAttempts: number = 60,
    delayMs: number = 1000
  ): Promise<SimulationResponse> {
    let attempts = 0;

    while (attempts < maxAttempts) {
      const simulation = await this.get(simulationId);

      // Check if simulation has results (indicates completion)
      // Backend stores results in the simulation.result field
      if (simulation.results !== null && simulation.results !== undefined) {
        return { ...simulation, status: 'completed' };
      }

      // Check if there's an error
      if (simulation.error) {
        return { ...simulation, status: 'failed' };
      }

      attempts++;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    throw new Error(`Simulation ${simulationId} did not complete within timeout`);
  }

  async getByPolicy(policyId: string, params?: PaginationParams): Promise<SimulationResponse[]> {
    // Get all simulations and filter by policy_id
    // In a real implementation, this would be a query parameter
    const allSimulations = await this.list(params);
    return allSimulations.filter((sim) => sim.policy_id === policyId);
  }

  async getLatestForPolicy(policyId: string): Promise<SimulationResponse | null> {
    const simulations = await this.getByPolicy(policyId);
    if (simulations.length === 0) return null;

    // Sort by created_at descending and return the first
    return simulations.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
  }
}

export const simulationsAPI = new SimulationsAPI();
