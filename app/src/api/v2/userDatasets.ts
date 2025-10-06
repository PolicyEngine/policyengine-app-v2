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
  async listUserDatasets(params?: PaginationParams): Promise<UserDatasetResponse[]> {
    return apiClient.get<UserDatasetResponse[]>('/user-datasets/', { params });
  }

  async getUserDataset(userDatasetId: string): Promise<UserDatasetResponse> {
    return apiClient.get<UserDatasetResponse>(`/user-datasets/${userDatasetId}`);
  }

  async createUserDataset(data: UserDatasetCreate): Promise<UserDatasetResponse> {
    return apiClient.post<UserDatasetResponse, UserDatasetCreate>('/user-datasets/', data);
  }

  async updateUserDataset(
    userDatasetId: string,
    data: UserDatasetUpdate
  ): Promise<UserDatasetResponse> {
    return apiClient.patch<UserDatasetResponse, UserDatasetUpdate>(
      `/user-datasets/${userDatasetId}`,
      data
    );
  }

  async deleteUserDataset(userDatasetId: string): Promise<void> {
    return apiClient.delete<void>(`/user-datasets/${userDatasetId}`);
  }
}

export const userDatasetsAPI = new UserDatasetsAPI();
