import { v2Fetch } from './v2Fetch';

export const API_V2_BASE_URL = import.meta.env.VITE_API_V2_URL || 'https://v2.api.policyengine.org';

/**
 * @deprecated No longer needed — API endpoints accept country_id directly.
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
  return v2Fetch<TaxBenefitModel[]>(
    `${API_V2_BASE_URL}/tax-benefit-models/`,
    'fetchTaxBenefitModels'
  );
}

/**
 * @deprecated No longer needed — API endpoints accept country_id directly.
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
  const modelName = getModelName(countryId);

  const models = await fetchTaxBenefitModels();
  const model = models.find((m) => m.name === modelName);
  if (!model) {
    throw new Error(`Model not found for country: ${countryId}`);
  }

  const versions = await v2Fetch<TaxBenefitModelVersion[]>(
    `${API_V2_BASE_URL}/tax-benefit-model-versions/`,
    'fetchModelByCountry:versions'
  );
  const modelVersions = versions.filter((v) => v.model_id === model.id);
  if (modelVersions.length === 0) {
    throw new Error(`No versions found for country: ${countryId}`);
  }

  // NOTE: Assumes the API returns versions with the latest first.
  // The version string format is unspecified, so we cannot sort client-side.
  return { model, latest_version: modelVersions[0] };
}

/**
 * Fetch the current version for a country's model
 */
export async function fetchModelVersion(countryId: string): Promise<string> {
  const modelName = getModelName(countryId);
  const models = await v2Fetch<TaxBenefitModel[]>(
    `${API_V2_BASE_URL}/tax-benefit-models/`,
    'fetchModelVersion:models'
  );
  const model = models.find((m) => m.name === modelName);
  if (!model) {
    throw new Error(`Model not found for ${countryId}`);
  }

  const versions = await v2Fetch<TaxBenefitModelVersion[]>(
    `${API_V2_BASE_URL}/tax-benefit-model-versions/`,
    'fetchModelVersion:versions'
  );
  const modelVersions = versions.filter((v) => v.model_id === model.id);

  if (modelVersions.length === 0) {
    throw new Error(`No versions found for ${countryId}`);
  }

  // NOTE: Assumes the API returns versions with the latest first.
  return modelVersions[0].version;
}

/**
 * Fetch the current version ID for a country's model
 */
export async function fetchModelVersionId(countryId: string): Promise<string> {
  const modelName = getModelName(countryId);
  const models = await v2Fetch<TaxBenefitModel[]>(
    `${API_V2_BASE_URL}/tax-benefit-models/`,
    'fetchModelVersionId:models'
  );
  const model = models.find((m) => m.name === modelName);
  if (!model) {
    throw new Error(`Model not found for ${countryId}`);
  }

  const versions = await v2Fetch<TaxBenefitModelVersion[]>(
    `${API_V2_BASE_URL}/tax-benefit-model-versions/`,
    'fetchModelVersionId:versions'
  );
  const modelVersions = versions.filter((v) => v.model_id === model.id);

  if (modelVersions.length === 0) {
    throw new Error(`No versions found for ${countryId}`);
  }

  // NOTE: Assumes the API returns versions with the latest first.
  return modelVersions[0].id;
}
