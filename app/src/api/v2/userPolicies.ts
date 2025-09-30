import { apiClient } from './client';

export interface UserPolicy {
  id: string;
  user_id: string;
  policy_id: string;
  custom_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserPolicyCreate {
  user_id: string;
  policy_id: string;
  custom_name?: string | null;
}

export interface UserPolicyUpdate {
  custom_name: string;
}

export const userPoliciesAPI = {
  create: async (data: UserPolicyCreate): Promise<UserPolicy> => {
    const response = await apiClient.post('/user-policies', data);
    return response.data;
  },

  list: async (userId: string): Promise<UserPolicy[]> => {
    const response = await apiClient.get('/user-policies', {
      params: { user_id: userId },
    });
    return response.data;
  },

  update: async (id: string, data: UserPolicyUpdate): Promise<UserPolicy> => {
    const response = await apiClient.patch(`/user-policies/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/user-policies/${id}`);
  },

  getCustomName: async (userId: string, policyId: string): Promise<string | null> => {
    const userPols = await userPoliciesAPI.list(userId);
    const match = userPols.find(up => up.policy_id === policyId);
    return match?.custom_name || null;
  },
};