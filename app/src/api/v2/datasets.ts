import { API_V2_BASE_URL, getModelId } from "./taxBenefitModels";

export interface Dataset {
  id: string;
  name: string;
  description: string;
  filepath: string;
  year: number;
  is_output_dataset: boolean;
  tax_benefit_model_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch all datasets for a country
 */
export async function fetchDatasets(countryId: string): Promise<Dataset[]> {
  const modelId = getModelId(countryId);
  const res = await fetch(
    `${API_V2_BASE_URL}/datasets/?tax_benefit_model_id=${modelId}`,
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch datasets for ${countryId}`);
  }

  return res.json();
}
