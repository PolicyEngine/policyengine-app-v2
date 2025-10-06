import { apiClient } from '../apiClient';

export interface UserReport {
  id: string;
  user_id: string;
  report_id: string;
  custom_name: string | null;
  is_creator: boolean;
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
  list: async (userId: string): Promise<UserReport[]> => {
    return await apiClient.get<UserReport[]>(`/users/${userId}/reports`);
  },

  create: async (userId: string, data: { report_id: string; custom_name?: string | null }): Promise<UserReport> => {
    return await apiClient.post<UserReport>(`/users/${userId}/reports`, data);
  },

  update: async (userId: string, reportId: string, data: UserReportUpdate): Promise<UserReport> => {
    return await apiClient.patch<UserReport>(`/users/${userId}/reports/${reportId}`, data);
  },

  delete: async (userId: string, reportId: string): Promise<void> => {
    await apiClient.delete(`/users/${userId}/reports/${reportId}`);
  },

  getCustomName: async (userId: string, reportId: string): Promise<string | null> => {
    const userReports = await userReportsAPI.list(userId);
    const match = userReports.find(ur => ur.report_id === reportId);
    return match?.custom_name || null;
  },
};
