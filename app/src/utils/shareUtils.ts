/**
 * Utilities for encoding/decoding shareable report URLs
 *
 * ShareData encodes user associations (not base ingredients) into a URL.
 * When decoding, we use the user associations to fetch base ingredients
 * via the shared useFetchReportIngredients utility.
 *
 * This approach mirrors the existing useUserReportById architecture:
 * user associations → fetch base ingredients → return EnhancedUserReport
 */

import {
  MinimalUserGeography,
  MinimalUserHousehold,
  MinimalUserPolicy,
  MinimalUserReport,
  MinimalUserSimulation,
} from '@/hooks/utils/useFetchReportIngredients';
import { CountryId, countryIds } from '@/libs/countries';
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
 * Contains user associations with their IDs and labels.
 * Base ingredients are NOT stored - they're fetched from API using these IDs.
 */
export interface ShareData {
  userReport: MinimalUserReport;
  userSimulations: MinimalUserSimulation[];
  userPolicies: MinimalUserPolicy[];
  userHouseholds: MinimalUserHousehold[];
  userGeographies: MinimalUserGeography[];
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

  // Validate userSimulations array
  if (!Array.isArray(obj.userSimulations)) {
    return false;
  }
  for (const sim of obj.userSimulations) {
    if (
      !sim ||
      typeof sim !== 'object' ||
      typeof (sim as Record<string, unknown>).simulationId !== 'string' ||
      typeof (sim as Record<string, unknown>).countryId !== 'string'
    ) {
      return false;
    }
  }

  // Validate userPolicies array
  if (!Array.isArray(obj.userPolicies)) {
    return false;
  }
  for (const pol of obj.userPolicies) {
    if (
      !pol ||
      typeof pol !== 'object' ||
      typeof (pol as Record<string, unknown>).policyId !== 'string' ||
      typeof (pol as Record<string, unknown>).countryId !== 'string'
    ) {
      return false;
    }
  }

  // Validate userHouseholds array
  if (!Array.isArray(obj.userHouseholds)) {
    return false;
  }
  for (const hh of obj.userHouseholds) {
    if (
      !hh ||
      typeof hh !== 'object' ||
      typeof (hh as Record<string, unknown>).householdId !== 'string' ||
      typeof (hh as Record<string, unknown>).countryId !== 'string'
    ) {
      return false;
    }
  }

  // Validate userGeographies array
  if (!Array.isArray(obj.userGeographies)) {
    return false;
  }
  for (const geo of obj.userGeographies) {
    if (!geo || typeof geo !== 'object') {
      return false;
    }
    const g = geo as Record<string, unknown>;
    if (
      typeof g.geographyId !== 'string' ||
      typeof g.countryId !== 'string' ||
      (g.scope !== 'national' && g.scope !== 'subnational')
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Build shareable URL path with encoded share data
 * Returns path + query string using userReportId in path
 * (e.g., "/us/report-output/sur-abc123?share=...")
 * Caller should prepend origin if full URL is needed
 */
export function buildSharePath(data: ShareData): string {
  const encoded = encodeShareData(data);
  const userReportId = data.userReport.id ?? data.userReport.reportId;
  return `/${data.userReport.countryId}/report-output/${userReportId}?share=${encoded}`;
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
 * Create ShareData from user associations
 *
 * Takes the user association objects and extracts the minimal data needed
 * for sharing (IDs and labels). Base ingredient data is not included
 * since it will be fetched from the API when the shared link is opened.
 */
export function createShareData(
  userReport: UserReport,
  userSimulations: UserSimulation[],
  userPolicies: UserPolicy[],
  userHouseholds: UserHouseholdPopulation[],
  userGeographies: UserGeographyPopulation[]
): ShareData | null {
  // userReport must have an id and reportId
  if (!userReport.id || !userReport.reportId) {
    return null;
  }

  return {
    userReport: {
      id: userReport.id,
      reportId: userReport.reportId,
      countryId: userReport.countryId,
      label: userReport.label ?? null,
    },
    userSimulations: userSimulations.map((s) => ({
      simulationId: s.simulationId,
      countryId: s.countryId,
      label: s.label ?? null,
    })),
    userPolicies: userPolicies.map((p) => ({
      policyId: p.policyId,
      countryId: p.countryId,
      label: p.label ?? null,
    })),
    userHouseholds: userHouseholds.map((h) => ({
      householdId: h.householdId,
      countryId: h.countryId,
      label: h.label ?? null,
    })),
    userGeographies: userGeographies.map((g) => ({
      geographyId: g.geographyId,
      countryId: g.countryId,
      scope: g.scope,
      label: g.label ?? null,
    })),
  };
}

/**
 * Get the userReportId from ShareData
 * Used for URL path and idempotent save
 */
export function getShareDataUserReportId(shareData: ShareData): string {
  return shareData.userReport.id ?? shareData.userReport.reportId;
}
