import { apiClient, PaginationParams } from '../apiClient';

export interface UserDatasetResponse {
  id: string;
  user_id: string;
  dataset_id: string;
  custom_name?: string;
  is_creator: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserDatasetCreate {
  user_id: string;
  dataset_id: string;
  custom_name?: string;
}

export interface UserDatasetUpdate {
  custom_name?: string;
}

class UserDatasetsAPI {
  async listUserDatasets(userId: string): Promise<UserDatasetResponse[]> {
    return apiClient.get<UserDatasetResponse[]>(`/users/${userId}/datasets`);
  }

  async createUserDataset(userId: string, data: { dataset_id: string; custom_name?: string }): Promise<UserDatasetResponse> {
    return apiClient.post<UserDatasetResponse>(`/users/${userId}/datasets`, data);
  }

  async updateUserDataset(
    userId: string,
    datasetId: string,
    data: UserDatasetUpdate
  ): Promise<UserDatasetResponse> {
    return apiClient.patch<UserDatasetResponse, UserDatasetUpdate>(
      `/users/${userId}/datasets/${datasetId}`,
      data
    );
  }

  async deleteUserDataset(userId: string, datasetId: string): Promise<void> {
    return apiClient.delete<void>(`/users/${userId}/datasets/${datasetId}`);
  }
}

export const userDatasetsAPI = new UserDatasetsAPI();
