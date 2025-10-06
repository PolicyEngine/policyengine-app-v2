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
  // List all reports for a user (new RESTful endpoint)
  list: async (userId: string): Promise<any[]> => {
    return await apiClient.get<any[]>(`/users/${userId}/reports`);
  },

  // Backward compatibility - these are no longer needed with the new structure
  // but keeping them for now in case anything still uses them
  create: async (data: UserReportCreate): Promise<UserReport> => {
    return await apiClient.post<UserReport>('/user-reports', data);
  },

  update: async (id: string, data: UserReportUpdate): Promise<UserReport> => {
    return await apiClient.patch<UserReport>(`/user-reports/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/user-reports/${id}`);
  },

  getCustomName: async (userId: string, reportId: string): Promise<string | null> => {
    // This will need to be updated when we have user report metadata
    return null;
  },
};
