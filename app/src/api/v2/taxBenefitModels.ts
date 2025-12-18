export const API_V2_BASE_URL = "https://v2.api.policyengine.org";

export const COUNTRY_TO_MODEL_ID: Record<string, string> = {
  us: "8ac12923-1282-420e-a440-0fa60d43950a",
  uk: "00652f95-f350-4932-b65d-9f9f03b4b8eb",
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
    throw new Error("Failed to fetch tax benefit models");
  }

  return res.json();
}

/**
 * Get the model ID for a country
 */
export function getModelId(countryId: string): string {
  const modelId = COUNTRY_TO_MODEL_ID[countryId];
  if (!modelId) {
    throw new Error(`Unknown country: ${countryId}`);
  }
  return modelId;
}

/**
 * Fetch the current version for a country's model
 */
export async function fetchModelVersion(countryId: string): Promise<string> {
  const modelId = getModelId(countryId);
  const res = await fetch(
    `${API_V2_BASE_URL}/tax-benefit-model-versions/?model_id=${modelId}`,
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch model version for ${countryId}`);
  }

  const versions: TaxBenefitModelVersion[] = await res.json();
  if (versions.length === 0) {
    throw new Error(`No versions found for ${countryId}`);
  }

  return versions[0].version;
}

/**
 * Fetch the current version ID for a country's model
 */
export async function fetchModelVersionId(countryId: string): Promise<string> {
  const modelId = getModelId(countryId);
  const res = await fetch(
    `${API_V2_BASE_URL}/tax-benefit-model-versions/?model_id=${modelId}`,
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch model version for ${countryId}`);
  }

  const versions: TaxBenefitModelVersion[] = await res.json();
  if (versions.length === 0) {
    throw new Error(`No versions found for ${countryId}`);
  }

  return versions[0].id;
}
