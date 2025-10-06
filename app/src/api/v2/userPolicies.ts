import { apiClient } from '../apiClient';

export interface UserPolicy {
  id: string;
  user_id: string;
  policy_id: string;
  custom_name: string | null;
  is_creator: boolean;
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
    return await apiClient.post<UserPolicy>('/user-policies', data);
  },

  list: async (userId: string): Promise<UserPolicy[]> => {
    return await apiClient.get<UserPolicy[]>('/user-policies', {
      params: { user_id: userId },
    });
  },

  update: async (id: string, data: UserPolicyUpdate): Promise<UserPolicy> => {
    return await apiClient.patch<UserPolicy>(`/user-policies/${id}`, data);
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