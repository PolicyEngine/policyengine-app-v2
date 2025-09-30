import { apiClient } from './client';

export interface UserSimulation {
  id: string;
  user_id: string;
  simulation_id: string;
  custom_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserSimulationCreate {
  user_id: string;
  simulation_id: string;
  custom_name?: string | null;
}

export interface UserSimulationUpdate {
  custom_name: string;
}

export const userSimulationsAPI = {
  create: async (data: UserSimulationCreate): Promise<UserSimulation> => {
    const response = await apiClient.post('/user-simulations', data);
    return response.data;
  },

  list: async (userId: string): Promise<UserSimulation[]> => {
    const response = await apiClient.get('/user-simulations', {
      params: { user_id: userId },
    });
    return response.data;
  },

  get: async (id: string): Promise<UserSimulation> => {
    const response = await apiClient.get(`/user-simulations/${id}`);
    return response.data;
  },

  update: async (id: string, data: UserSimulationUpdate): Promise<UserSimulation> => {
    const response = await apiClient.patch(`/user-simulations/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/user-simulations/${id}`);
  },

  // Get custom name for a simulation, or return null if not found
  getCustomName: async (userId: string, simulationId: string): Promise<string | null> => {
    const userSims = await userSimulationsAPI.list(userId);
    const match = userSims.find(us => us.simulation_id === simulationId);
    return match?.custom_name || null;
  },
};