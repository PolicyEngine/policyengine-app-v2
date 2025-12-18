import { API_V2_BASE_URL, getModelId } from "./taxBenefitModels";
import type { Variable } from "@/storage";

export type { Variable };

const DEFAULT_LIMIT = 10000;

/**
 * Fetch all variables for a country
 */
export async function fetchVariables(
  countryId: string,
  limit: number = DEFAULT_LIMIT,
): Promise<Variable[]> {
  const modelId = getModelId(countryId);
  const res = await fetch(
    `${API_V2_BASE_URL}/variables/?tax_benefit_model_id=${modelId}&limit=${limit}`,
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch variables for ${countryId}`);
  }

  return res.json();
}
