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
  list: async (userId: string): Promise<UserSimulation[]> => {
    return await apiClient.get<UserSimulation[]>(`/users/${userId}/simulations`);
  },

  create: async (userId: string, data: { simulation_id: string; custom_name?: string | null }): Promise<UserSimulation> => {
    return await apiClient.post<UserSimulation>(`/users/${userId}/simulations`, data);
  },

  update: async (userId: string, simulationId: string, data: UserSimulationUpdate): Promise<UserSimulation> => {
    return await apiClient.patch<UserSimulation>(`/users/${userId}/simulations/${simulationId}`, data);
  },

  delete: async (userId: string, simulationId: string): Promise<void> => {
    await apiClient.delete(`/users/${userId}/simulations/${simulationId}`);
  },

  getCustomName: async (userId: string, simulationId: string): Promise<string | null> => {
    const userSims = await userSimulationsAPI.list(userId);
    const match = userSims.find(us => us.simulation_id === simulationId);
    return match?.custom_name || null;
  },
};