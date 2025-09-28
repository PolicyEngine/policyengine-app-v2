import { apiClient } from '../apiClient';

export type ReportElementType = 'markdown' | 'chart' | 'table' | 'metric';

export interface ReportElement {
  id: string;
  report_id?: string;
  label: string;
  type: string; // 'markdown', 'chart', etc.
  markdown_content?: string; // For markdown type elements
  data_table?: string;
  data_type?: string;
  created_at?: string;
  updated_at?: string;
  position?: number;
}

export interface ReportElementCreate {
  report_id: string;
  label: string; // Required by API
  type: string; // Required by API
  markdown_content?: string; // For markdown elements
  data_type?: string;
  data?: any;
  position?: number;
}

export interface ReportElementUpdate {
  label?: string;
  markdown_content?: string; // For updating markdown
  position?: number;
  type?: string;
  data_type?: string;
  data?: any;}

// For markdown elements specifically
export interface MarkdownContent {
  text: string;
}

class ReportElementsAPI {
  async list(reportId: string): Promise<ReportElement[]> {
    // Use query parameter to filter by report_id
    return apiClient.get<ReportElement[]>(`/report-elements/`, {
      params: { report_id: reportId }
    });
  }

  async get(elementId: string): Promise<ReportElement> {
    return apiClient.get<ReportElement>(`/report-elements/${elementId}`);
  }

  async create(data: ReportElementCreate): Promise<ReportElement> {
    // API expects label and type as required fields
    // For markdown, also include markdown_content
    const payload: any = {
      label: data.label,
      type: data.type,
      report_id: data.report_id,
      data_type: data.data_type,
      data: data.data,
      position: data.position
    };

    // Add markdown_content if it's a markdown element
    if (data.type === 'markdown' && data.markdown_content) {
      payload.markdown_content = data.markdown_content;
    }

    console.log('Sending report element create request:', {
      url: `/report-elements/`,
      data: payload
    });

    try {
      const response = await apiClient.post<ReportElement, any>(
        `/report-elements/`,
        payload
      );
      console.log('Report element created successfully:', response);
      return response;
    } catch (error: any) {
      console.error('Report element creation failed:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  }

  async update(
    elementId: string,
    data: ReportElementUpdate
  ): Promise<ReportElement> {
    console.log('Sending PATCH request to:', `/report-elements/${elementId}`);
    console.log('PATCH data:', JSON.stringify(data, null, 2));
    console.log('Data keys:', Object.keys(data));
    console.log('markdown_content value:', data.markdown_content);
    console.log('markdown_content type:', typeof data.markdown_content);

    // Build query parameters from the data object
    const params = new URLSearchParams();
    if (data.markdown_content !== undefined) {
      params.append('markdown_content', data.markdown_content);
    }
    if (data.label !== undefined) {
      params.append('label', data.label);
    }
    if (data.position !== undefined) {
      params.append('position', data.position.toString());
    }
    if (data.type !== undefined) {
      params.append('type', data.type);
    }
    if (data.data_type !== undefined) {
      params.append('data_type', data.data_type);
    }

    const queryString = params.toString();
    const url = `/report-elements/${elementId}${queryString ? `?${queryString}` : ''}`;

    console.log('PATCH URL with params:', url);

    // FastAPI expects query parameters for PATCH, not body
    const response = await apiClient.patch<ReportElement>(
      url,
      {} // Empty body since params are in URL
    );

    console.log('PATCH response:', response);
    return response;
  }

  async delete(elementId: string): Promise<void> {
    return apiClient.delete<void>(`/report-elements/${elementId}`);
  }

  async reorder(_reportId: string, _elementIds: string[]): Promise<void> {
    // This endpoint might not exist yet - commenting out for now
    // return apiClient.post<void, { element_ids: string[] }>(
    //   `/report-elements/reorder`,
    //   { report_id: _reportId, element_ids: _elementIds }
    // );
    console.warn('Reorder endpoint not implemented yet');
    return Promise.resolve();
  }
}

export const reportElementsAPI = new ReportElementsAPI();