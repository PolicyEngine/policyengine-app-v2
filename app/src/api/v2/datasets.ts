import { API_V2_BASE_URL, getModelName } from "./taxBenefitModels";
import type { V2DatasetMetadata } from "@/types/metadata";

/**
 * Fetch all datasets for a country
 */
export async function fetchDatasets(countryId: string): Promise<V2DatasetMetadata[]> {
  const modelName = getModelName(countryId);
  const res = await fetch(
    `${API_V2_BASE_URL}/datasets/?tax_benefit_model_name=${modelName}`,
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch datasets for ${countryId}`);
  }

  return res.json();
}
