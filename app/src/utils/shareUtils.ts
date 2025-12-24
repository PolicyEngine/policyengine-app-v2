/**
 * Utilities for encoding/decoding shareable report URLs
 *
 * All share-related URL logic lives here. To change what data goes in the URL
 * or how it's encoded, only this file needs to be modified.
 */

import { CountryId, countryIds } from '@/libs/countries';
import { Geography } from '@/types/ingredients/Geography';
import { Household } from '@/types/ingredients/Household';
import { Policy } from '@/types/ingredients/Policy';
import { Report } from '@/types/ingredients/Report';
import { Simulation } from '@/types/ingredients/Simulation';
import { UserPolicy } from '@/types/ingredients/UserPolicy';
import {
  UserGeographyPopulation,
  UserHouseholdPopulation,
} from '@/types/ingredients/UserPopulation';
import { UserReport } from '@/types/ingredients/UserReport';
import { UserSimulation } from '@/types/ingredients/UserSimulation';

/**
 * Data encoded in shareable URLs
 *
 * Includes base ingredient IDs (for API fetching), userReportId
 * (for idempotent save), and labels (for exact UI reproduction).
 */
export interface ShareData {
  // Base ingredient IDs (for API fetching)
  reportId: string;
  countryId: CountryId;
  year: string;
  simulationIds: string[];
  policyIds: string[];
  householdId?: string | null;
  geographyId?: string | null;

  // User report ID (for idempotent save and URL path)
  userReportId: string;

  // Label fields (for exact UI reproduction)
  reportLabel?: string | null;
  simulationLabels?: (string | null)[];
  policyLabels?: (string | null)[];
  householdLabel?: string | null;
  geographyLabel?: string | null;
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
    countryIds.includes(obj.countryId as CountryId) &&
    typeof obj.year === 'string' &&
    typeof obj.userReportId === 'string'; // NEW: userReportId is required

  const hasRequiredArrays =
    Array.isArray(obj.simulationIds) &&
    obj.simulationIds.every((id) => typeof id === 'string') &&
    Array.isArray(obj.policyIds) &&
    obj.policyIds.every((id) => typeof id === 'string');

  // Validate optional base ingredient IDs
  const hasValidOptionalIds =
    (obj.householdId === undefined ||
      obj.householdId === null ||
      typeof obj.householdId === 'string') &&
    (obj.geographyId === undefined ||
      obj.geographyId === null ||
      typeof obj.geographyId === 'string');

  // Validate optional labels (strings or null, or arrays of strings/null)
  const hasValidOptionalLabels =
    (obj.reportLabel === undefined ||
      obj.reportLabel === null ||
      typeof obj.reportLabel === 'string') &&
    (obj.simulationLabels === undefined ||
      (Array.isArray(obj.simulationLabels) &&
        obj.simulationLabels.every((l) => l === null || typeof l === 'string'))) &&
    (obj.policyLabels === undefined ||
      (Array.isArray(obj.policyLabels) &&
        obj.policyLabels.every((l) => l === null || typeof l === 'string'))) &&
    (obj.householdLabel === undefined ||
      obj.householdLabel === null ||
      typeof obj.householdLabel === 'string') &&
    (obj.geographyLabel === undefined ||
      obj.geographyLabel === null ||
      typeof obj.geographyLabel === 'string');

  return hasRequiredStrings && hasRequiredArrays && hasValidOptionalIds && hasValidOptionalLabels;
}

/**
 * Build shareable URL path with encoded share data
 * Returns path + query string using userReportId in path
 * (e.g., "/us/report-output/sur-abc123?share=...")
 * Caller should prepend origin if full URL is needed
 */
export function buildSharePath(countryId: CountryId, data: ShareData): string {
  const encoded = encodeShareData(data);
  return `/${countryId}/report-output/${data.userReportId}?share=${encoded}`;
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
 *
 * Includes user association IDs and labels for exact UI reproduction
 * and idempotent save functionality.
 */
export function createShareDataFromReport(
  report: Report,
  simulations: Simulation[],
  policies: Policy[],
  households: Household[],
  geographies: Geography[],
  // User association parameters (for IDs and labels)
  userReport?: UserReport,
  userSimulations?: UserSimulation[],
  userPolicies?: UserPolicy[],
  userHouseholds?: UserHouseholdPopulation[],
  userGeographies?: UserGeographyPopulation[]
): ShareData | null {
  if (!report.id) {
    return null;
  }

  // userReportId is required for the new URL pattern
  if (!userReport?.id) {
    return null;
  }

  // Ensure all IDs are strings (API may return numbers)
  const policyIds = policies
    .map((p) => p.id)
    .filter((id) => id != null)
    .map((id) => String(id));

  const simulationIds = report.simulationIds.map((id) => String(id));

  // Determine population type from first simulation
  const firstSim = simulations[0];
  const isHousehold = firstSim?.populationType === 'household';

  const householdId = isHousehold && households[0]?.id ? String(households[0].id) : null;
  const geographyId = !isHousehold && geographies[0]?.id ? String(geographies[0].id) : null;

  // Build positional label arrays (matching simulationIds/policyIds order)
  const simulationLabels = simulationIds.map((simId) => {
    const userSim = userSimulations?.find((us) => String(us.simulationId) === simId);
    return userSim?.label ?? null;
  });

  const policyLabels = policyIds.map((policyId) => {
    const userPolicy = userPolicies?.find((up) => String(up.policyId) === policyId);
    return userPolicy?.label ?? null;
  });

  // Get household/geography labels
  const householdLabel = isHousehold ? (userHouseholds?.[0]?.label ?? null) : null;
  const geographyLabel = !isHousehold ? (userGeographies?.[0]?.label ?? null) : null;

  return {
    // Base ingredient IDs
    reportId: String(report.id),
    countryId: report.countryId,
    year: report.year,
    simulationIds,
    policyIds,
    householdId,
    geographyId,
    // User report ID (for idempotent save)
    userReportId: userReport.id,
    // Labels
    reportLabel: userReport.label ?? report.label ?? null,
    simulationLabels,
    policyLabels,
    householdLabel,
    geographyLabel,
  };
}
