import { API_V2_BASE_URL, getModelId } from "./taxBenefitModels";
import type { Parameter, ParameterValue } from "@/storage";

// API defaults to 100 records; set high to fetch all
const DEFAULT_LIMIT = 10000;

/**
 * Fetch all parameters for a country.
 */
export async function fetchParameters(
  countryId: string,
  limit: number = DEFAULT_LIMIT,
): Promise<Parameter[]> {
  const modelId = getModelId(countryId);
  const res = await fetch(
    `${API_V2_BASE_URL}/parameters/?tax_benefit_model_id=${modelId}&limit=${limit}`,
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch parameters for ${countryId}`);
  }

  return res.json();
}

/**
 * Fetch all parameter values for a country.
 */
export async function fetchParameterValues(
  countryId: string,
): Promise<ParameterValue[]> {
  const modelId = getModelId(countryId);
  const res = await fetch(
    `${API_V2_BASE_URL}/parameter-values/?tax_benefit_model_id=${modelId}`,
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch parameter values for ${countryId}`);
  }

  return res.json();
}
