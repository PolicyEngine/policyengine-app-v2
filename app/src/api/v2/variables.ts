/**
 * Variables API client
 */

import { apiClient } from '../apiClient';

export interface Variable {
  name: string;
  label?: string;
  description?: string;
  documentation?: string;
  entity?: string;
  value_type?: string;
  unit?: string;
  definition_period?: string;
  default_value?: any;
  adds?: string[];
  subtracts?: string[];
}

/**
 * Variables API
 */
export const variablesAPI = {
  /**
   * Get a single variable by name
   */
  async get(variableName: string): Promise<Variable> {
    return apiClient.get(`/variables/${variableName}`);
  },

  /**
   * List all variables
   */
  async list(params?: { limit?: number; offset?: number }): Promise<Variable[]> {
    return apiClient.get('/variables/', { params });
  },

  /**
   * Search variables by query
   */
  async search(query: string, params?: { limit?: number }): Promise<Variable[]> {
    return apiClient.get('/variables/search', { params: { query, ...params } });
  },
};
