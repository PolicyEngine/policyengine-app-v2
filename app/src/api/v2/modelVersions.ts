import { apiClient } from '../apiClient';

export interface ModelVersion {
  id: string;
  model_id: string;
  version: string;
  created_at?: string;
  updated_at?: string;
}

class ModelVersionsAPI {
  async get(modelVersionId: string): Promise<ModelVersion> {
    return apiClient.get<ModelVersion>(`/model-versions/${modelVersionId}`);
  }

  async list(): Promise<ModelVersion[]> {
    return apiClient.get<ModelVersion[]>('/model-versions/');
  }
}

export const modelVersionsAPI = new ModelVersionsAPI();