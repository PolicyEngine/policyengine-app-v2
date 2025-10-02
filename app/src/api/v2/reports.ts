import { apiClient, PaginationParams } from '../apiClient';
import { reportElementTemplates, getTemplate, type ReportElementTemplate } from './reportElementTemplates';

// Note: Reports endpoint not yet available in API
// This is placeholder for when it becomes available

export interface ReportElement {
  id: string;
  type: 'chart' | 'text' | 'custom';
  templateId?: string; // If using a template
  title?: string;
  description?: string;
  recordRequests?: Array<{
    endpoint: string;
    params: Record<string, any>;
    description?: string;
  }>;
  chartConfig?: any;
  content?: string;
}

export interface ReportResponse {
  id: string;
  label: string;
  description?: string;
  elements?: ReportElement[];
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
  elements?: ReportElement[];
  simulation_ids?: string[];
}

export interface ReportUpdate {
  label?: string;
  description?: string;
  elements?: ReportElement[];
  simulation_ids?: string[];
}

interface ReportListParams extends PaginationParams {
  user_id?: string;
}

class ReportsAPI {
  async list(params?: ReportListParams): Promise<ReportResponse[]> {
    return apiClient.get<ReportResponse[]>('/reports/', { params });
  }

  async get(reportId: string): Promise<ReportResponse> {
    return apiClient.get<ReportResponse>(`/reports/${reportId}`);
  }

  async create(data: ReportCreate): Promise<ReportResponse> {
    return apiClient.post<ReportResponse, ReportCreate>('/reports/', data);
  }

  async update(reportId: string, data: ReportUpdate): Promise<ReportResponse> {
    return apiClient.patch<ReportResponse, ReportUpdate>(`/reports/${reportId}`, data);
  }

  async delete(reportId: string): Promise<void> {
    return apiClient.delete<void>(`/reports/${reportId}`);
  }

  /**
   * Create a report element from a template
   */
  createElementFromTemplate(
    templateId: string,
    params: {
      country: string;
      baselinePolicyId: number;
      reformPolicyId: number;
      timePeriod: string;
      region?: string;
    }
  ): ReportElement | null {
    const template = getTemplate(templateId);
    if (!template) return null;

    return {
      id: `${templateId}-${Date.now()}`,
      type: 'chart',
      templateId: template.id,
      title: template.name,
      description: template.description,
      recordRequests: template.recordRequests(params),
    };
  }

  /**
   * Get available templates
   */
  getTemplates(): ReportElementTemplate[] {
    return reportElementTemplates;
  }

  /**
   * Get template by ID
   */
  getTemplate(id: string): ReportElementTemplate | undefined {
    return getTemplate(id);
  }
}

export const reportsAPI = new ReportsAPI();

// Re-export template utilities for convenience
export { reportElementTemplates, getTemplate, getTemplatesByCategory, getTemplateCategories } from './reportElementTemplates';
