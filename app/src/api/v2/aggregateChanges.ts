import { apiClient } from "../apiClient";

export interface AggregateChange {
  id: string;
  baseline_simulation_id: string;
  comparison_simulation_id: string;
  entity: string;
  variable_name: string;
  year?: number | null;
  filter_variable_name?: string | null;
  filter_variable_value?: string | null;
  filter_variable_leq?: number | null;
  filter_variable_geq?: number | null;
  filter_variable_quantile_leq?: number | null;
  filter_variable_quantile_geq?: number | null;
  filter_variable_quantile_value?: string | null;
  aggregate_function: "sum" | "mean" | "median" | "count";
  reportelement_id?: string | null;
  baseline_value?: number | null;
  comparison_value?: number | null;
  change?: number | null;
  relative_change?: number | null;
}

export interface CreateAggregateChangeRequest {
  baseline_simulation_id: string;
  comparison_simulation_id: string;
  entity: string;
  variable_name: string;
  year?: number | null;
  filter_variable_name?: string | null;
  filter_variable_value?: string | null;
  filter_variable_leq?: number | null;
  filter_variable_geq?: number | null;
  filter_variable_quantile_leq?: number | null;
  filter_variable_quantile_geq?: number | null;
  filter_variable_quantile_value?: string | null;
  aggregate_function: "sum" | "mean" | "median" | "count";
  reportelement_id?: string | null;
}

export const aggregateChangesAPI = {
  async list(filters?: {
    baseline_simulation_id?: string;
    comparison_simulation_id?: string;
    reportelement_id?: string;
    entity?: string;
    variable_name?: string;
  }): Promise<AggregateChange[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value);
        }
      });
    }

    return apiClient.get<AggregateChange[]>(`/aggregate-changes?${params.toString()}`);
  },

  async get(id: string): Promise<AggregateChange> {
    return apiClient.get<AggregateChange>(`/aggregate-changes/${id}`);
  },

  async create(aggregateChange: CreateAggregateChangeRequest): Promise<AggregateChange> {
    return apiClient.post<AggregateChange, CreateAggregateChangeRequest>('/aggregate-changes', aggregateChange);
  },

  async createBulk(aggregateChanges: CreateAggregateChangeRequest[]): Promise<AggregateChange[]> {
    return apiClient.post<AggregateChange[], CreateAggregateChangeRequest[]>('/aggregate-changes/bulk', aggregateChanges);
  },

  async update(id: string, data: Partial<AggregateChange>): Promise<AggregateChange> {
    return apiClient.patch<AggregateChange, Partial<AggregateChange>>(`/aggregate-changes/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/aggregate-changes/${id}`);
  },

  async getByReportElement(reportElementId: string): Promise<AggregateChange[]> {
    return apiClient.get<AggregateChange[]>(`/aggregate-changes/by-report-element/${reportElementId}`);
  },

  async waitForCompletion(
    aggregateChangeIds: string[],
    maxAttempts: number = 60,
    delayMs: number = 1000
  ): Promise<AggregateChange[]> {
    let attempts = 0;

    while (attempts < maxAttempts) {
      const aggregateChanges = await Promise.all(aggregateChangeIds.map(id => this.get(id)));

      // Check if all aggregate changes have values (indicates completion)
      const allCompleted = aggregateChanges.every(
        ac => ac.change !== null && ac.change !== undefined
      );

      if (allCompleted) {
        return aggregateChanges;
      }

      attempts++;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    throw new Error(`Aggregate changes did not complete within timeout`);
  }
};