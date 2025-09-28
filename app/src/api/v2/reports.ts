import { apiClient, PaginationParams } from '../apiClient';

// Note: Reports endpoint not yet available in API
// This is placeholder for when it becomes available

export interface ReportResponse {
  id: string;
  label: string;
  description?: string;
  simulation_ids?: string[];
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  results?: any;
  error?: string;
  created_at: string;
  updated_at?: string;
}

export interface ReportCreate {
  label: string;
  description?: string;
  simulation_ids?: string[];
}

class ReportsAPI {
  async list(params?: PaginationParams): Promise<ReportResponse[]> {
    // Will use this endpoint when available
    return apiClient.get<ReportResponse[]>('/reports/', { params });
  }

  async get(reportId: string): Promise<ReportResponse> {
    return apiClient.get<ReportResponse>(`/reports/${reportId}`);
  }

  async create(data: ReportCreate): Promise<ReportResponse> {
    return apiClient.post<ReportResponse, ReportCreate>('/reports/', data);
  }

  async delete(reportId: string): Promise<void> {
    return apiClient.delete<void>(`/reports/${reportId}`);
  }
}

export const reportsAPI = new ReportsAPI();
