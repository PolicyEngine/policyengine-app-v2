/**
 * Utilities for encoding/decoding shareable report URLs
 *
 * Encodes user associations (not base ingredients) into a URL using ReportIngredientsInput.
 * When decoding, we use the user associations to fetch base ingredients
 * via the shared useFetchReportIngredients utility.
 *
 * This approach mirrors the existing useUserReportById architecture:
 * user associations → fetch base ingredients → return EnhancedUserReport
 *
 * Uses URL-safe base64 encoding for maximum browser compatibility.
 */

import { ReportIngredientsInput } from '@/hooks/utils/useFetchReportIngredients';
import { CountryId, countryIds } from '@/libs/countries';
import { UserPolicy } from '@/types/ingredients/UserPolicy';
import {
  UserGeographyPopulation,
  UserHouseholdPopulation,
} from '@/types/ingredients/UserPopulation';
import { UserReport } from '@/types/ingredients/UserReport';
import { UserSimulation } from '@/types/ingredients/UserSimulation';

/**
 * Encode ReportIngredientsInput to a URL-safe base64 string.
 * Uses URL-safe characters: + → -, / → _, removes = padding.
 */
export function encodeShareData(data: ReportIngredientsInput): string {
  const json = JSON.stringify(data);
  const base64 = btoa(json);
  // Make URL-safe: replace + with -, / with _, remove = padding
  const urlSafe = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return urlSafe;
}

/**
 * Decode URL-safe base64 string back to ReportIngredientsInput.
 * Returns null if decoding fails or data is invalid.
 */
export function decodeShareData(encoded: string): ReportIngredientsInput | null {
  try {
    // Restore standard base64 characters
    let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');

    // Add back padding if needed
    const paddingNeeded = (4 - (base64.length % 4)) % 4;
    base64 += '='.repeat(paddingNeeded);

    const json = atob(base64);
    const data = JSON.parse(json);

    if (!isValidShareData(data)) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * Validate that an array contains objects with required string fields
 */
function isValidArrayWithStringFields(
  arr: unknown,
  requiredFields: string[],
  additionalValidator?: (item: Record<string, unknown>) => boolean
): boolean {
  if (!Array.isArray(arr)) {
    return false;
  }
  return arr.every((item) => {
    if (!item || typeof item !== 'object') {
      return false;
    }
    const obj = item as Record<string, unknown>;
    const hasRequiredFields = requiredFields.every((field) => typeof obj[field] === 'string');
    if (!hasRequiredFields) {
      return false;
    }
    return additionalValidator ? additionalValidator(obj) : true;
  });
}

/**
 * Type guard to validate ReportIngredientsInput structure for sharing
 */
export function isValidShareData(data: unknown): data is ReportIngredientsInput {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const obj = data as Record<string, unknown>;

  // Validate userReport
  if (!obj.userReport || typeof obj.userReport !== 'object') {
    return false;
  }
  const userReport = obj.userReport as Record<string, unknown>;
  if (
    typeof userReport.reportId !== 'string' ||
    typeof userReport.countryId !== 'string' ||
    !countryIds.includes(userReport.countryId as CountryId)
  ) {
    return false;
  }

  // Validate arrays with their required fields
  if (!isValidArrayWithStringFields(obj.userSimulations, ['simulationId', 'countryId'])) {
    return false;
  }

  if (!isValidArrayWithStringFields(obj.userPolicies, ['policyId', 'countryId'])) {
    return false;
  }

  if (!isValidArrayWithStringFields(obj.userHouseholds, ['householdId', 'countryId'])) {
    return false;
  }

  if (
    !isValidArrayWithStringFields(obj.userGeographies, ['geographyId', 'countryId'], (geo) =>
      ['national', 'subnational'].includes(geo.scope as string)
    )
  ) {
    return false;
  }

  return true;
}

/**
 * Build shareable URL path with encoded share data
 * Returns path + query string using userReportId in path
 * (e.g., "/us/report-output/sur-abc123?share=...")
 * Caller should prepend origin if full URL is needed
 */
export function buildSharePath(data: ReportIngredientsInput): string {
  const encoded = encodeShareData(data);
  const userReportId = data.userReport.id ?? data.userReport.reportId;
  return `/${data.userReport.countryId}/report-output/${userReportId}?share=${encoded}`;
}

/**
 * Extract ReportIngredientsInput from URL search params
 * Returns null if share param is missing or invalid
 */
export function extractShareDataFromUrl(
  searchParams: URLSearchParams
): ReportIngredientsInput | null {
  const shareParam = searchParams.get('share');
  if (!shareParam) {
    return null;
  }
  return decodeShareData(shareParam);
}

/**
 * Create ReportIngredientsInput from user associations for sharing
 *
 * Takes the user association objects and strips userId/timestamps for sharing.
 * Base ingredient data is not included since it will be fetched from the API
 * when the shared link is opened.
 */
export function createShareData(
  userReport: UserReport,
  userSimulations: UserSimulation[],
  userPolicies: UserPolicy[],
  userHouseholds: UserHouseholdPopulation[],
  userGeographies: UserGeographyPopulation[]
): ReportIngredientsInput | null {
  // userReport must have an id and reportId
  if (!userReport.id || !userReport.reportId) {
    return null;
  }

  // Helper to strip userId and timestamp fields
  const stripUserFields = <T extends { userId?: string; createdAt?: string; updatedAt?: string }>(
    obj: T
  ): Omit<T, 'userId' | 'createdAt' | 'updatedAt'> => {
    const { userId, createdAt, updatedAt, ...rest } = obj;
    return rest;
  };

  return {
    userReport: stripUserFields(userReport),
    userSimulations: userSimulations.map(stripUserFields),
    userPolicies: userPolicies.map(stripUserFields),
    userHouseholds: userHouseholds.map(stripUserFields),
    userGeographies: userGeographies.map(stripUserFields),
  };
}

/**
 * Get the userReportId from ReportIngredientsInput
 * Used for URL path and idempotent save
 */
export function getShareDataUserReportId(shareData: ReportIngredientsInput): string {
  return shareData.userReport.id ?? shareData.userReport.reportId;
}
