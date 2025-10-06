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
  list: async (userId: string): Promise<UserPolicy[]> => {
    return await apiClient.get<UserPolicy[]>(`/users/${userId}/policies`);
  },

  create: async (userId: string, data: { policy_id: string; custom_name?: string | null }): Promise<UserPolicy> => {
    return await apiClient.post<UserPolicy>(`/users/${userId}/policies`, data);
  },

  update: async (userId: string, policyId: string, data: UserPolicyUpdate): Promise<UserPolicy> => {
    return await apiClient.patch<UserPolicy>(`/users/${userId}/policies/${policyId}`, data);
  },

  delete: async (userId: string, policyId: string): Promise<void> => {
    await apiClient.delete(`/users/${userId}/policies/${policyId}`);
  },

  getCustomName: async (userId: string, policyId: string): Promise<string | null> => {
    const userPols = await userPoliciesAPI.list(userId);
    const match = userPols.find(up => up.policy_id === policyId);
    return match?.custom_name || null;
  },
};