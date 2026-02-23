export const API_V2_BASE_URL = import.meta.env.VITE_API_V2_URL || 'https://v2.api.policyengine.org';

/**
 * Map country IDs to their API model names.
 * The API uses model names (e.g., "policyengine-us") for filtering.
 */
export const COUNTRY_TO_MODEL_NAME: Record<string, string> = {
  us: 'policyengine-us',
  uk: 'policyengine-uk',
};

export interface TaxBenefitModel {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface TaxBenefitModelVersion {
  id: string;
  model_id: string;
  version: string;
}

/**
 * Fetch all tax benefit models
 */
export async function fetchTaxBenefitModels(): Promise<TaxBenefitModel[]> {
  const res = await fetch(`${API_V2_BASE_URL}/tax-benefit-models/`);

  if (!res.ok) {
    throw new Error('Failed to fetch tax benefit models');
  }

  return res.json();
}

/**
 * Get the model name for a country (e.g., "policyengine-us")
 */
export function getModelName(countryId: string): string {
  const modelName = COUNTRY_TO_MODEL_NAME[countryId];
  if (!modelName) {
    throw new Error(`Unknown country: ${countryId}`);
  }
  return modelName;
}

export interface ModelByCountryResponse {
  model: TaxBenefitModel;
  latest_version: TaxBenefitModelVersion;
}

/**
 * Fetch model + latest version for a country in a single call.
 */
export async function fetchModelByCountry(countryId: string): Promise<ModelByCountryResponse> {
  const res = await fetch(`${API_V2_BASE_URL}/tax-benefit-models/by-country/${countryId}`);

  if (!res.ok) {
    throw new Error(`Failed to fetch model for country: ${countryId}`);
  }

  return res.json();
}

/**
 * Fetch the current version for a country's model
 */
export async function fetchModelVersion(countryId: string): Promise<string> {
  const modelName = getModelName(countryId);
  const res = await fetch(`${API_V2_BASE_URL}/tax-benefit-models/`);

  if (!res.ok) {
    throw new Error(`Failed to fetch models`);
  }

  const models: TaxBenefitModel[] = await res.json();
  const model = models.find((m) => m.name === modelName);
  if (!model) {
    throw new Error(`Model not found for ${countryId}`);
  }

  const versionsRes = await fetch(`${API_V2_BASE_URL}/tax-benefit-model-versions/`);

  if (!versionsRes.ok) {
    throw new Error(`Failed to fetch model versions`);
  }

  const versions: TaxBenefitModelVersion[] = await versionsRes.json();
  const modelVersions = versions.filter((v) => v.model_id === model.id);

  if (modelVersions.length === 0) {
    throw new Error(`No versions found for ${countryId}`);
  }

  return modelVersions[0].version;
}

/**
 * Fetch the current version ID for a country's model
 */
export async function fetchModelVersionId(countryId: string): Promise<string> {
  const modelName = getModelName(countryId);
  const res = await fetch(`${API_V2_BASE_URL}/tax-benefit-models/`);

  if (!res.ok) {
    throw new Error(`Failed to fetch models`);
  }

  const models: TaxBenefitModel[] = await res.json();
  const model = models.find((m) => m.name === modelName);
  if (!model) {
    throw new Error(`Model not found for ${countryId}`);
  }

  const versionsRes = await fetch(`${API_V2_BASE_URL}/tax-benefit-model-versions/`);

  if (!versionsRes.ok) {
    throw new Error(`Failed to fetch model versions`);
  }

  const versions: TaxBenefitModelVersion[] = await versionsRes.json();
  const modelVersions = versions.filter((v) => v.model_id === model.id);

  if (modelVersions.length === 0) {
    throw new Error(`No versions found for ${countryId}`);
  }

  return modelVersions[0].id;
}
