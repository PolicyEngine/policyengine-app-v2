import { apiClient } from '../apiClient';

export interface UserReport {
  id: string;
  user_id: string;
  report_id: string;
  custom_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserReportCreate {
  user_id: string;
  report_id: string;
  custom_name?: string | null;
}

export interface UserReportUpdate {
  custom_name: string;
}

export const userReportsAPI = {
  create: async (data: UserReportCreate): Promise<UserReport> => {
    return await apiClient.post<UserReport>('/user-reports', data);
  },

  list: async (userId: string): Promise<UserReport[]> => {
    return await apiClient.get<UserReport[]>('/user-reports', {
      params: { user_id: userId },
    });
  },

  update: async (id: string, data: UserReportUpdate): Promise<UserReport> => {
    return await apiClient.patch<UserReport>(`/user-reports/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/user-reports/${id}`);
  },

  getCustomName: async (userId: string, reportId: string): Promise<string | null> => {
    const userReports = await userReportsAPI.list(userId);
    const match = userReports.find(ur => ur.report_id === reportId);
    return match?.custom_name || null;
  },
};
