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
    console.log('[decodeShareData] Input length:', encoded.length);
    console.log('[decodeShareData] First 100 chars:', encoded.substring(0, 100));

    // Restore standard base64 characters
    let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');

    // Add back padding if needed
    const paddingNeeded = (4 - (base64.length % 4)) % 4;
    base64 += '='.repeat(paddingNeeded);

    console.log('[decodeShareData] After base64 restore, length:', base64.length);

    let json: string;
    try {
      json = atob(base64);
    } catch (atobError) {
      console.error('[decodeShareData] atob() failed:', atobError);
      return null;
    }

    console.log('[decodeShareData] Decoded JSON length:', json.length);

    let data: unknown;
    try {
      data = JSON.parse(json);
    } catch (parseError) {
      console.error('[decodeShareData] JSON.parse() failed:', parseError);
      console.log('[decodeShareData] Raw JSON (first 500 chars):', json.substring(0, 500));
      return null;
    }

    console.log('[decodeShareData] Parsed data keys:', Object.keys(data as object));

    if (!isValidShareData(data)) {
      console.error('[decodeShareData] Validation failed - see isValidShareData logs above');
      return null;
    }

    console.log('[decodeShareData] Success!');
    return data;
  } catch (error) {
    console.error('[decodeShareData] Unexpected error:', error);
    return null;
  }
}

/**
 * Validate that an array contains objects with required string or number fields
 * (IDs can be either strings or numbers depending on source)
 */
function isValidArrayWithStringOrNumberFields(
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
    // Accept both strings and numbers for ID fields
    const hasRequiredFields = requiredFields.every((field) => {
      const value = obj[field];
      return typeof value === 'string' || typeof value === 'number';
    });
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
    console.error('[isValidShareData] Data is not an object:', typeof data);
    return false;
  }

  const obj = data as Record<string, unknown>;

  // Validate userReport
  if (!obj.userReport || typeof obj.userReport !== 'object') {
    console.error('[isValidShareData] userReport missing or not an object');
    return false;
  }
  const userReport = obj.userReport as Record<string, unknown>;
  if (typeof userReport.reportId !== 'string' && typeof userReport.reportId !== 'number') {
    console.error(
      '[isValidShareData] userReport.reportId is not a string or number:',
      userReport.reportId
    );
    return false;
  }
  if (typeof userReport.countryId !== 'string') {
    console.error(
      '[isValidShareData] userReport.countryId is not a string:',
      userReport.countryId
    );
    return false;
  }
  if (!countryIds.includes(userReport.countryId as CountryId)) {
    console.error(
      '[isValidShareData] userReport.countryId not in allowed list:',
      userReport.countryId,
      'allowed:',
      countryIds
    );
    return false;
  }

  // Validate arrays with their required fields (IDs can be strings or numbers)
  if (!isValidArrayWithStringOrNumberFields(obj.userSimulations, ['simulationId', 'countryId'])) {
    console.error('[isValidShareData] userSimulations validation failed:', obj.userSimulations);
    return false;
  }

  if (!isValidArrayWithStringOrNumberFields(obj.userPolicies, ['policyId', 'countryId'])) {
    console.error('[isValidShareData] userPolicies validation failed:', obj.userPolicies);
    return false;
  }

  if (!isValidArrayWithStringOrNumberFields(obj.userHouseholds, ['householdId', 'countryId'])) {
    console.error('[isValidShareData] userHouseholds validation failed:', obj.userHouseholds);
    return false;
  }

  if (
    !isValidArrayWithStringOrNumberFields(obj.userGeographies, ['geographyId', 'countryId'], (geo) =>
      ['national', 'subnational'].includes(geo.scope as string)
    )
  ) {
    console.error('[isValidShareData] userGeographies validation failed:', obj.userGeographies);
    return false;
  }

  console.log('[isValidShareData] All validations passed');
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
  console.log('[extractShareDataFromUrl] share param present:', !!shareParam);
  if (!shareParam) {
    console.log('[extractShareDataFromUrl] No share param in URL');
    return null;
  }
  console.log('[extractShareDataFromUrl] share param length:', shareParam.length);
  const result = decodeShareData(shareParam);
  console.log('[extractShareDataFromUrl] Decode result:', result ? 'success' : 'null');
  return result;
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
