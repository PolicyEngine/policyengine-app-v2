import { apiClient } from '../apiClient';

export interface UserDynamic {
  id: string;
  user_id: string;
  dynamic_id: string;
  custom_name: string | null;
  is_creator: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserDynamicCreate {
  user_id: string;
  dynamic_id: string;
  custom_name?: string | null;
}

export interface UserDynamicUpdate {
  custom_name: string;
}

export const userDynamicsAPI = {
  list: async (userId: string): Promise<UserDynamic[]> => {
    return await apiClient.get<UserDynamic[]>(`/users/${userId}/dynamics`);
  },

  create: async (userId: string, data: { dynamic_id: string; custom_name?: string | null }): Promise<UserDynamic> => {
    return await apiClient.post<UserDynamic>(`/users/${userId}/dynamics`, data);
  },

  update: async (userId: string, dynamicId: string, data: UserDynamicUpdate): Promise<UserDynamic> => {
    return await apiClient.patch<UserDynamic>(`/users/${userId}/dynamics/${dynamicId}`, data);
  },

  delete: async (userId: string, dynamicId: string): Promise<void> => {
    await apiClient.delete(`/users/${userId}/dynamics/${dynamicId}`);
  },

  getCustomName: async (userId: string, dynamicId: string): Promise<string | null> => {
    const userDyns = await userDynamicsAPI.list(userId);
    const match = userDyns.find(ud => ud.dynamic_id === dynamicId);
    return match?.custom_name || null;
  },
};