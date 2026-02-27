/**
 * V1 Report Migration Utility
 *
 * Reads v1 report associations from localStorage, fetches v1 report/simulation
 * metadata to extract parameters, re-runs calculations via v2 analysis endpoints,
 * and creates v2 user-report associations.
 *
 * This is intentionally manual — triggered by a button on the Reports page.
 * Migration re-runs calculations through v2, so economy reports may be slow.
 */

import { fetchReportById } from '@/api/report';
import { LocalStorageReportStore } from '@/api/reportAssociation';
import { fetchSimulationById } from '@/api/simulation';
import { createEconomyAnalysis } from '@/api/v2/economyAnalysis';
import { createHouseholdAnalysis } from '@/api/v2/householdAnalysis';
import { getModelName } from '@/api/v2/taxBenefitModels';
import { createUserReportAssociationV2 } from '@/api/v2/userReportAssociations';
import { createUserSimulationAssociationV2 } from '@/api/v2/userSimulationAssociations';
import type { countryIds } from '@/libs/countries';
import type { UserReport } from '@/types/ingredients/UserReport';

// ============================================================================
// Types
// ============================================================================

export interface MigrationProgress {
  total: number;
  current: number;
  succeeded: string[];
  failed: { label: string; error: string }[];
}

// ============================================================================
// localStorage helpers
// ============================================================================

const localReportStore = new LocalStorageReportStore();

export async function hasV1ReportsToMigrate(userId: string, countryId?: string): Promise<boolean> {
  const reports = await localReportStore.findByUser(userId, countryId);
  return reports.length > 0;
}

export async function getV1ReportCount(userId: string, countryId?: string): Promise<number> {
  const reports = await localReportStore.findByUser(userId, countryId);
  return reports.length;
}

// ============================================================================
// Migration logic
// ============================================================================

/**
 * Migrate a single v1 report to v2 by re-running its calculation.
 *
 * 1. Fetch v1 report metadata → get simulation IDs
 * 2. Fetch v1 simulation metadata → get population type, population ID, policy ID
 * 3. Call v2 analysis endpoint with equivalent params
 * 4. Create v2 user-report + user-simulation associations
 */
async function migrateSingleReport(
  v1UserReport: UserReport,
  userId: string,
  countryId: (typeof countryIds)[number]
): Promise<void> {
  // 1. Fetch v1 report metadata
  const v1Report = await fetchReportById(countryId, v1UserReport.reportId);

  // 2. Fetch v1 simulation metadata to get population/policy params
  const v1Sim = await fetchSimulationById(countryId, String(v1Report.simulation_1_id));

  // 3. Re-run via v2 analysis endpoint
  const isHousehold = v1Sim.population_type === 'household';
  const label = v1UserReport.label || `Report #${v1UserReport.reportId}`;

  let reportId: string;
  let baselineSimId: string | null = null;
  let reformSimId: string | null = null;

  if (isHousehold) {
    const response = await createHouseholdAnalysis({
      household_id: v1Sim.population_id,
      policy_id: v1Sim.policy_id || null,
    });
    reportId = response.report_id;
    baselineSimId = response.baseline_simulation?.id ?? null;
    reformSimId = response.reform_simulation?.id ?? null;
  } else {
    const response = await createEconomyAnalysis({
      tax_benefit_model_name: getModelName(countryId),
      region: v1Sim.population_id,
      policy_id: v1Sim.policy_id || null,
    });
    reportId = response.report_id;
    baselineSimId = response.baseline_simulation?.id ?? null;
    reformSimId = response.reform_simulation?.id ?? null;
  }

  // 4. Create v2 user-report association
  await createUserReportAssociationV2({
    userId,
    reportId,
    countryId,
    label: `Migrated: ${label}`,
    outputType: isHousehold ? 'household' : 'economy',
  });

  // 5. Create v2 user-simulation associations for the new simulations
  if (baselineSimId) {
    await createUserSimulationAssociationV2({
      userId,
      simulationId: baselineSimId,
      countryId,
      label: `Baseline — ${label}`,
    });
  }

  if (reformSimId) {
    await createUserSimulationAssociationV2({
      userId,
      simulationId: reformSimId,
      countryId,
      label: `Reform — ${label}`,
    });
  }
}

/**
 * Migrate all v1 reports for a user to v2.
 *
 * Processes reports sequentially (not in parallel) to avoid overwhelming
 * the API with concurrent analysis requests.
 */
export async function migrateV1Reports(
  userId: string,
  countryId: (typeof countryIds)[number],
  onProgress?: (progress: MigrationProgress) => void
): Promise<MigrationProgress> {
  const v1Reports = await localReportStore.findByUser(userId, countryId);

  const progress: MigrationProgress = {
    total: v1Reports.length,
    current: 0,
    succeeded: [],
    failed: [],
  };

  for (const v1UserReport of v1Reports) {
    const label = v1UserReport.label || `Report #${v1UserReport.reportId}`;
    try {
      await migrateSingleReport(v1UserReport, userId, countryId);
      progress.succeeded.push(label);
    } catch (error) {
      console.error(`[v1ReportMigration] Failed to migrate "${label}":`, error);
      progress.failed.push({ label, error: String(error) });
    }
    progress.current++;
    onProgress?.(progress);
  }

  return progress;
}
