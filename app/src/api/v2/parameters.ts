import { API_V2_BASE_URL, getModelId } from "./taxBenefitModels";
import type { Parameter } from "@/storage";

/**
 * Fetch all parameters for a country.
 */
export async function fetchParameters(countryId: string): Promise<Parameter[]> {
  const modelId = getModelId(countryId);
  const res = await fetch(
    `${API_V2_BASE_URL}/parameters/?tax_benefit_model_id=${modelId}&limit=10000`,
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch parameters for ${countryId}`);
  }

  return res.json();
}
