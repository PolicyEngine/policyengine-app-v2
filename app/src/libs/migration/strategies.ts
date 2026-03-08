/**
 * Migration Strategy Functions
 *
 * Bottom-layer functions that handle migrating individual record types
 * from v1 to v2. Each strategy is a single-purpose function that:
 * 1. Fetches the v1 entity
 * 2. Converts/maps it to v2 format
 * 3. Creates the v2 entity via the appropriate API
 *
 * These are composed by orchestrators (orchestrators.ts) to migrate
 * full user-ingredient trees.
 */

import type { CountryId } from '@/libs/countries';
import type { MigrationResult } from './types';

// Base entity APIs
import { fetchV1Policy, createPolicy, type V2PolicyParameterValue } from '@/api/policy';
import { fetchV1Household, v1ResponseToHousehold } from '@/api/legacyConversion';
import { createHouseholdV2 } from '@/api/v2/households';
import { fetchModelByCountry } from '@/api/v2/taxBenefitModels';
import { fetchParametersByName } from '@/api/v2/parameterTree';

// User association APIs
import { createUserPolicyAssociationV2 } from '@/api/v2/userPolicyAssociations';
import { createUserHouseholdAssociationV2 } from '@/api/v2/userHouseholdAssociations';
import { createUserSimulationAssociationV2 } from '@/api/v2/userSimulationAssociations';
import { createUserReportAssociationV2 } from '@/api/v2/userReportAssociations';

// ============================================================================
// Base Entity Strategies
// ============================================================================

/**
 * Migrate a v1 policy to v2.
 *
 * 1. Fetch v1 policy → get parameter name → date-range → value map
 * 2. Look up v2 parameter UUIDs via fetchParametersByName
 * 3. Get tax_benefit_model_id via fetchModelByCountry
 * 4. Create v2 policy with mapped parameter values
 *
 * Returns null v2Id for current-law (no policy to migrate).
 */
export async function migratePolicy(
  countryId: CountryId,
  v1PolicyId: string | null | undefined
): Promise<MigrationResult> {
  if (!v1PolicyId) {
    return { success: true, v2Id: null, v1Id: '' };
  }

  try {
    const v1PolicyJson = await fetchV1Policy(countryId, v1PolicyId);

    const paramNames = Object.keys(v1PolicyJson);
    if (paramNames.length === 0) {
      return { success: true, v2Id: null, v1Id: v1PolicyId };
    }

    const [v2Params, modelInfo] = await Promise.all([
      fetchParametersByName(paramNames, countryId),
      fetchModelByCountry(countryId),
    ]);

    const nameToUuid = new Map(v2Params.map((p) => [p.name, p.id]));

    const parameterValues: V2PolicyParameterValue[] = [];
    for (const [paramName, dateRangeMap] of Object.entries(v1PolicyJson)) {
      const parameterId = nameToUuid.get(paramName);
      if (!parameterId) {
        continue;
      }

      for (const [dateRange, value] of Object.entries(dateRangeMap)) {
        const [startStr, endStr] = parseDateRange(dateRange);
        parameterValues.push({
          parameter_id: parameterId,
          value_json: value,
          start_date: startStr,
          end_date: endStr,
        });
      }
    }

    const v2Policy = await createPolicy({
      name: `Migrated policy (v1 #${v1PolicyId})`,
      tax_benefit_model_id: modelInfo.model.id,
      parameter_values: parameterValues,
    });

    return { success: true, v2Id: v2Policy.id, v1Id: v1PolicyId };
  } catch (err) {
    return {
      success: false,
      v1Id: v1PolicyId,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Migrate a v1 household to v2.
 *
 * 1. Fetch v1 household (raw named-people, year-keyed format)
 * 2. Convert to v2 Alpha format via v1ResponseToHousehold
 * 3. Create v2 household via createHouseholdV2
 */
export async function migrateHousehold(
  countryId: CountryId,
  v1HouseholdId: string
): Promise<MigrationResult> {
  try {
    const v1Data = await fetchV1Household(countryId, v1HouseholdId);
    const v2Household = v1ResponseToHousehold(v1Data, countryId);
    const created = await createHouseholdV2(v2Household);

    return { success: true, v2Id: created.id, v1Id: v1HouseholdId };
  } catch (err) {
    return {
      success: false,
      v1Id: v1HouseholdId,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Geography "migration" — no-op passthrough.
 * Region codes are the same in v1 and v2.
 */
export function migrateGeography(
  _countryId: CountryId,
  regionCode: string
): MigrationResult {
  return { success: true, v2Id: regionCode, v1Id: regionCode };
}

// ============================================================================
// User Association Strategies
// ============================================================================

/**
 * Create a v2 user-policy association.
 */
export async function migrateUserPolicyAssociation(
  v2PolicyId: string,
  userId: string,
  countryId: CountryId,
  label?: string
): Promise<MigrationResult> {
  try {
    const created = await createUserPolicyAssociationV2({
      userId,
      policyId: v2PolicyId,
      countryId,
      label,
    });

    return { success: true, v2Id: created.id, v1Id: v2PolicyId };
  } catch (err) {
    return {
      success: false,
      v1Id: v2PolicyId,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Create a v2 user-household association.
 */
export async function migrateUserHouseholdAssociation(
  v2HouseholdId: string,
  userId: string,
  countryId: CountryId,
  label?: string
): Promise<MigrationResult> {
  try {
    const created = await createUserHouseholdAssociationV2({
      userId,
      householdId: v2HouseholdId,
      countryId,
      label,
    });

    return { success: true, v2Id: created.id, v1Id: v2HouseholdId };
  } catch (err) {
    return {
      success: false,
      v1Id: v2HouseholdId,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Create a v2 user-simulation association.
 */
export async function migrateUserSimulationAssociation(
  v2SimulationId: string,
  userId: string,
  countryId: CountryId,
  label?: string
): Promise<MigrationResult> {
  try {
    const created = await createUserSimulationAssociationV2({
      userId,
      simulationId: v2SimulationId,
      countryId,
      label,
    });

    return { success: true, v2Id: created.id, v1Id: v2SimulationId };
  } catch (err) {
    return {
      success: false,
      v1Id: v2SimulationId,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Create a v2 user-report association.
 */
export async function migrateUserReportAssociation(
  v2ReportId: string,
  userId: string,
  countryId: CountryId,
  label?: string
): Promise<MigrationResult> {
  try {
    const created = await createUserReportAssociationV2({
      userId,
      reportId: v2ReportId,
      countryId,
      label,
    });

    return { success: true, v2Id: created.id, v1Id: v2ReportId };
  } catch (err) {
    return {
      success: false,
      v1Id: v2ReportId,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Parse a v1 date range string into v2 start/end ISO timestamps.
 *
 * V1 format examples:
 * - "2025-01-01.2025-12-31" → two dates separated by "."
 * - "2025.2026" → year range
 * - "2025" → single year
 *
 * V2 format: ISO timestamps like "2025-01-01T00:00:00Z"
 */
function parseDateRange(dateRange: string): [string, string | null] {
  const parts = dateRange.split('.');

  if (parts.length === 2) {
    return [toIsoTimestamp(parts[0]), toIsoTimestamp(parts[1])];
  }

  return [toIsoTimestamp(parts[0]), null];
}

/**
 * Convert a date string or year to ISO timestamp format.
 */
function toIsoTimestamp(dateStr: string): string {
  if (/^\d{4}$/.test(dateStr)) {
    return `${dateStr}-01-01T00:00:00Z`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return `${dateStr}T00:00:00Z`;
  }

  return dateStr;
}
