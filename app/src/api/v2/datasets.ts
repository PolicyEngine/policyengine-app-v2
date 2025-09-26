import { apiClient, PaginationParams } from '../apiClient';

export interface DatasetResponse {
  id: string;
  name: string;
  description?: string;
  type: 'household' | 'population' | 'economic';
  country?: string;
  source?: string;
  created_at: string;
  updated_at: string;
}

export interface VersionedDatasetResponse {
  id: string;
  dataset_id: string;
  version: string;
  data?: any;
  metadata?: any;
  valid_from?: string;
  valid_to?: string;
  created_at: string;
  updated_at: string;
}

export interface DatasetCreate {
  name: string;
  description?: string;
  type: 'household' | 'population' | 'economic';
  country?: string;
  source?: string;
}

export interface DatasetUpdate {
  name?: string;
  description?: string;
  source?: string;
}

export interface VersionedDatasetCreate {
  dataset_id: string;
  version: string;
  data?: any;
  metadata?: any;
  valid_from?: string;
  valid_to?: string;
}

class DatasetsAPI {
  // Datasets
  async listDatasets(params?: PaginationParams): Promise<DatasetResponse[]> {
    return apiClient.get<DatasetResponse[]>('/datasets/', { params });
  }

  async getDataset(datasetId: string): Promise<DatasetResponse> {
    return apiClient.get<DatasetResponse>(`/datasets/${datasetId}`);
  }

  async createDataset(data: DatasetCreate): Promise<DatasetResponse> {
    return apiClient.post<DatasetResponse, DatasetCreate>('/datasets/', data);
  }

  async updateDataset(datasetId: string, data: DatasetUpdate): Promise<DatasetResponse> {
    return apiClient.patch<DatasetResponse, DatasetUpdate>(`/datasets/${datasetId}`, data);
  }

  async deleteDataset(datasetId: string): Promise<void> {
    return apiClient.delete<void>(`/datasets/${datasetId}`);
  }

  // Versioned Datasets
  async listVersionedDatasets(params?: PaginationParams): Promise<VersionedDatasetResponse[]> {
    return apiClient.get<VersionedDatasetResponse[]>('/versioned-datasets/', { params });
  }

  async getVersionedDataset(versionedDatasetId: string): Promise<VersionedDatasetResponse> {
    return apiClient.get<VersionedDatasetResponse>(`/versioned-datasets/${versionedDatasetId}`);
  }

  async createVersionedDataset(data: VersionedDatasetCreate): Promise<VersionedDatasetResponse> {
    return apiClient.post<VersionedDatasetResponse, VersionedDatasetCreate>(
      '/versioned-datasets/',
      data
    );
  }

  async deleteVersionedDataset(versionedDatasetId: string): Promise<void> {
    return apiClient.delete<void>(`/versioned-datasets/${versionedDatasetId}`);
  }

  // Helper methods
  async getDatasetVersions(datasetId: string): Promise<VersionedDatasetResponse[]> {
    const allVersions = await this.listVersionedDatasets({ limit: 1000 });
    return allVersions.filter((v) => v.dataset_id === datasetId);
  }

  async getLatestVersion(datasetId: string): Promise<VersionedDatasetResponse | null> {
    const versions = await this.getDatasetVersions(datasetId);
    if (versions.length === 0) return null;

    // Sort by version descending and return the first
    return versions.sort((a, b) => b.version.localeCompare(a.version))[0];
  }

  async getHouseholdDatasets(country?: string): Promise<DatasetResponse[]> {
    const datasets = await this.listDatasets({ limit: 1000 });
    return datasets.filter(
      (d) => d.type === 'household' && (!country || d.country === country)
    );
  }

  async getPopulationDatasets(country?: string): Promise<DatasetResponse[]> {
    const datasets = await this.listDatasets({ limit: 1000 });
    return datasets.filter(
      (d) => d.type === 'population' && (!country || d.country === country)
    );
  }
}

export const datasetsAPI = new DatasetsAPI();