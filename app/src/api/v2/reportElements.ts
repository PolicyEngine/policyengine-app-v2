import { apiClient } from '../apiClient';

export type ReportElementType = 'markdown' | 'chart' | 'table' | 'metric';

export interface ReportElement {
  id: string;
  report_id?: string;
  label: string;
  type: string; // 'markdown' or 'data'
  markdown_content?: string; // For markdown type elements
  position?: number;
  processed_output_type?: 'markdown' | 'plotly';
  processed_output?: string; // Markdown text or JSON string for plotly
  created_at?: string;
  updated_at?: string;
}

export interface ReportElementCreate {
  report_id?: string;
  label: string; // Required by API
  type: string; // Required by API ('markdown' or 'data')
  markdown_content?: string; // For markdown elements
  position?: number;
  processed_output_type?: string;
  processed_output?: string;
}

export interface ReportElementUpdate {
  label?: string;
  type?: string;
  markdown_content?: string; // For updating markdown
  position?: number;
  processed_output_type?: string;
  processed_output?: string;
}

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
    const payload: any = {
      label: data.label,
      type: data.type,
      report_id: data.report_id,
      position: data.position,
      markdown_content: data.markdown_content,
      processed_output_type: data.processed_output_type,
      processed_output: data.processed_output
    };

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

    // API now accepts body parameters for PATCH
    const response = await apiClient.patch<ReportElement, ReportElementUpdate>(
      `/report-elements/${elementId}`,
      data
    );

    console.log('PATCH response:', response);
    return response;
  }

  async getByReport(reportId: string): Promise<ReportElement[]> {
    console.log('Fetching report elements for report:', reportId);
    const response = await apiClient.get<ReportElement[]>(`/report-elements/`, {
      params: { report_id: reportId }
    });
    console.log('Report elements response:', response);
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

  async createAI(
    prompt: string,
    reportId: string,
    simulationIds: string[]
  ): Promise<{
    report_element: ReportElement;
    aggregates: any[];
    aggregate_changes: any[];
    explanation: string;
  }> {
    console.log('Creating AI report element:', {
      prompt,
      reportId,
      simulationIds
    });

    const response = await apiClient.post<{
      report_element: ReportElement;
      aggregates: any[];
      aggregate_changes: any[];
      explanation: string;
    }>('/report-elements/ai', {
      prompt,
      report_id: reportId,
      simulation_ids: simulationIds
    });

    console.log('AI report element response:', response);
    return response;
  }

  async processWithAI(
    prompt: string,
    context: any,
    elementId: string
  ): Promise<{
    type: 'markdown' | 'plotly';
    content: any;
  }> {
    const response = await apiClient.post<{
      type: 'markdown' | 'plotly';
      content: any;
    }>('/report-elements/ai/process', {
      prompt,
      context,
      element_id: elementId
    });

    console.log('[API] processWithAI response:', response);
    console.log('[API] response.type:', response.type);
    console.log('[API] response.content:', typeof response.content, response.content);

    return response;
  }
}

export const reportElementsAPI = new ReportElementsAPI();