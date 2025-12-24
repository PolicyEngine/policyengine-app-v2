import { API_V2_BASE_URL, getModelId } from "./taxBenefitModels";
import type { Variable } from "@/storage";

/**
 * Fetch all variables for a country.
 */
export async function fetchVariables(countryId: string): Promise<Variable[]> {
  const modelId = getModelId(countryId);
  const res = await fetch(
    `${API_V2_BASE_URL}/variables/?tax_benefit_model_id=${modelId}&limit=10000`,
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch variables for ${countryId}`);
  }

  return res.json();
}
