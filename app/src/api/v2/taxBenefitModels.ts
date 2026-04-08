import { v2Fetch } from './v2Fetch';

export const API_V2_BASE_URL =
  process.env.NEXT_PUBLIC_API_V2_URL || 'https://v2.api.policyengine.org';

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
  return v2Fetch<ModelByCountryResponse>(
    `${API_V2_BASE_URL}/tax-benefit-models/by-country/${countryId}`,
    `fetchModelByCountry(${countryId})`
  );
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
