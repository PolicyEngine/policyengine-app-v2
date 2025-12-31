/**
 * Utilities for encoding/decoding shareable report URLs
 *
 * All share-related URL logic lives here. To change what data goes in the URL
 * or how it's encoded, only this file needs to be modified.
 */

import { Geography } from '@/types/ingredients/Geography';
import { Household } from '@/types/ingredients/Household';
import { Policy } from '@/types/ingredients/Policy';
import { Report } from '@/types/ingredients/Report';
import { Simulation } from '@/types/ingredients/Simulation';

/**
 * Data encoded in shareable URLs
 */
export interface ShareData {
  reportId: string;
  countryId: string;
  year: string;
  simulationIds: string[];
  policyIds: string[];
  householdId?: string | null;
  geographyId?: string | null;
}

/**
 * Encode ShareData to URL-safe Base64 string
 * Uses URL-safe characters: + → -, / → _, removes = padding
 */
export function encodeShareData(data: ShareData): string {
  const json = JSON.stringify(data);
  const base64 = btoa(json);
  const urlSafe = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return urlSafe;
}

/**
 * Decode URL-safe Base64 string back to ShareData
 * Returns null if decoding fails or data is invalid
 */
export function decodeShareData(encoded: string): ShareData | null {
  try {
    // Restore standard Base64 characters
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
 * Type guard to validate ShareData structure
 */
export function isValidShareData(data: unknown): data is ShareData {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const obj = data as Record<string, unknown>;

  const hasRequiredStrings =
    typeof obj.reportId === 'string' &&
    typeof obj.countryId === 'string' &&
    typeof obj.year === 'string';

  const hasRequiredArrays =
    Array.isArray(obj.simulationIds) &&
    obj.simulationIds.every((id) => typeof id === 'string') &&
    Array.isArray(obj.policyIds) &&
    obj.policyIds.every((id) => typeof id === 'string');

  const hasValidOptionals =
    (obj.householdId === undefined ||
      obj.householdId === null ||
      typeof obj.householdId === 'string') &&
    (obj.geographyId === undefined ||
      obj.geographyId === null ||
      typeof obj.geographyId === 'string');

  return hasRequiredStrings && hasRequiredArrays && hasValidOptionals;
}

/**
 * Build shareable URL path with encoded share data
 * Returns path + query string (e.g., "/us/report-output/shared?share=...")
 * Caller should prepend origin if full URL is needed
 */
export function buildSharePath(countryId: string, data: ShareData): string {
  const encoded = encodeShareData(data);
  return `/${countryId}/report-output/shared?share=${encoded}`;
}

/**
 * Extract ShareData from URL search params
 * Returns null if share param is missing or invalid
 */
export function extractShareDataFromUrl(searchParams: URLSearchParams): ShareData | null {
  const shareParam = searchParams.get('share');
  if (!shareParam) {
    return null;
  }
  return decodeShareData(shareParam);
}

/**
 * Create ShareData from report entities
 * Helper to build ShareData from the various report-related objects
 */
export function createShareDataFromReport(
  report: Report,
  simulations: Simulation[],
  policies: Policy[],
  households: Household[],
  geographies: Geography[]
): ShareData | null {
  if (!report.id) {
    return null;
  }

  const policyIds = policies.map((p) => p.id).filter((id): id is string => !!id);

  // Determine population type from first simulation
  const firstSim = simulations[0];
  const isHousehold = firstSim?.populationType === 'household';

  const householdId = isHousehold ? households[0]?.id : null;
  const geographyId = !isHousehold ? geographies[0]?.id : null;

  return {
    reportId: report.id,
    countryId: report.countryId,
    year: report.year,
    simulationIds: report.simulationIds,
    policyIds,
    householdId,
    geographyId,
  };
}
