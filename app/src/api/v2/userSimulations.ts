import { apiClient } from '../apiClient';

export interface UserSimulation {
  id: string;
  user_id: string;
  simulation_id: string;
  custom_name: string | null;
  is_creator: boolean;
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
    return await apiClient.post<UserSimulation>('/user-simulations', data);
  },

  list: async (userId: string): Promise<UserSimulation[]> => {
    return await apiClient.get<UserSimulation[]>('/user-simulations', {
      params: { user_id: userId },
    });
  },

  get: async (id: string): Promise<UserSimulation> => {
    return await apiClient.get<UserSimulation>(`/user-simulations/${id}`);
  },

  update: async (id: string, data: UserSimulationUpdate): Promise<UserSimulation> => {
    return await apiClient.patch<UserSimulation>(`/user-simulations/${id}`, data);
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