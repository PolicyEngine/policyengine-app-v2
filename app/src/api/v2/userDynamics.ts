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
  create: async (data: UserDynamicCreate): Promise<UserDynamic> => {
    return await apiClient.post<UserDynamic>('/user-dynamics', data);
  },

  list: async (userId: string): Promise<UserDynamic[]> => {
    return await apiClient.get<UserDynamic[]>('/user-dynamics', {
      params: { user_id: userId },
    });
  },

  get: async (id: string): Promise<UserDynamic> => {
    return await apiClient.get<UserDynamic>(`/user-dynamics/${id}`);
  },

  update: async (id: string, data: UserDynamicUpdate): Promise<UserDynamic> => {
    return await apiClient.patch<UserDynamic>(`/user-dynamics/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/user-dynamics/${id}`);
  },

  getCustomName: async (userId: string, dynamicId: string): Promise<string | null> => {
    const userDyns = await userDynamicsAPI.list(userId);
    const match = userDyns.find(ud => ud.dynamic_id === dynamicId);
    return match?.custom_name || null;
  },
};