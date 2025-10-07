import { apiClient, PaginationParams } from '../apiClient';

export interface UserResponse {
  id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  current_model_id: string;
  created_at: string;
  updated_at: string;
  policies?: any[];
  simulations?: any[];
  reports?: any[];
  datasets?: any[];
  dynamics?: any[];
}

export interface UserCreate {
  username: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

export interface UserUpdate {
  username?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  current_model_id?: string;
}

class UsersAPI {
  async listUsers(params?: PaginationParams): Promise<UserResponse[]> {
    return apiClient.get<UserResponse[]>('/users/', { params });
  }

  async getUser(userId: string): Promise<UserResponse> {
    return apiClient.get<UserResponse>(`/users/${userId}`);
  }

  async createUser(data: UserCreate): Promise<UserResponse> {
    return apiClient.post<UserResponse, UserCreate>('/users/', data);
  }

  async updateUser(userId: string, data: UserUpdate): Promise<UserResponse> {
    return apiClient.patch<UserResponse, UserUpdate>(`/users/${userId}`, data);
  }

  async deleteUser(userId: string): Promise<void> {
    return apiClient.delete<void>(`/users/${userId}`);
  }

  getDisplayName(user: UserResponse): string {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user.first_name) {
      return user.first_name;
    }
    return user.username;
  }
}

export const usersAPI = new UsersAPI();
