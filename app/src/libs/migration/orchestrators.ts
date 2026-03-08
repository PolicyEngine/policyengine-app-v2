/**
 * Migration Orchestrator Functions
 *
 * Composition layer that combines strategy functions to migrate
 * full user-ingredient trees. Each orchestrator:
 * 1. Reads a user association from localStorage
 * 2. Fetches the v1 base entity metadata
 * 3. Migrates dependencies (policies, households) via strategies
 * 4. Creates the v2 entity via analysis endpoints (for reports) or strategies
 * 5. Creates the v2 user association via strategies
 *
 * The report orchestrator is the top-level entry point for migration.
 */

import type {
  OrchestratorResult,
  MigrationError,
  MigrationRunResult,
  MigrationProgress,
  V1ReportInfo,
} from './types';

// V1 fetch functions
import { fetchReportById } from '@/api/report';
import { fetchSimulationById } from '@/api/simulation';

// V2 analysis endpoints (create report + simulations server-side)
import { createHouseholdAnalysis } from '@/api/v2/householdAnalysis';
import { createEconomyAnalysis } from '@/api/v2/economyAnalysis';
import { getModelName } from '@/api/v2/taxBenefitModels';

// Strategy functions
import {
  migratePolicy,
  migrateHousehold,
  migrateGeography,
  migrateUserReportAssociation,
  migrateUserSimulationAssociation,
} from './strategies';

// Detection
import { detectV1Reports } from './detect';

// ============================================================================
// Report Orchestrator
// ============================================================================

/**
 * Orchestrate migration of a single v1 report.
 *
 * Given a v1 report's info (from detection), this:
 * 1. Fetches the v1 report metadata to get simulation IDs
 * 2. Fetches the v1 simulation metadata to get policy/population info
 * 3. Migrates the policy (if reform, not current law)
 * 4. Migrates the population (household or geography)
 * 5. Creates a v2 report via the analysis endpoint (which creates v2 sims)
 * 6. Creates the v2 user-report association
 */
export async function orchestrateReportMigration(
  reportInfo: V1ReportInfo,
  userId: string
): Promise<OrchestratorResult> {
  const errors: MigrationError[] = [];
  const { countryId, reportId, userReportId, label } = reportInfo;

  try {
    // Step 1: Fetch v1 report metadata
    const v1Report = await fetchReportById(countryId, reportId);

    // Step 2: Fetch v1 simulation metadata (simulation_1_id is the reform sim)
    const v1SimId = v1Report.simulation_1_id;
    const v1Sim = await fetchSimulationById(countryId, v1SimId);

    // Step 3: Migrate policy
    const policyResult = await migratePolicy(countryId, v1Sim.policy_id);
    if (!policyResult.success) {
      errors.push({
        stage: 'policy',
        v1Id: v1Sim.policy_id,
        message: policyResult.error ?? 'Unknown policy migration error',
      });
      return {
        success: false,
        v1UserAssociationId: userReportId,
        v2Ids: {},
        errors,
      };
    }

    // Step 4: Migrate population
    const isHousehold = v1Sim.population_type === 'household';
    let v2PopulationId: string | null = null;

    if (isHousehold) {
      const householdResult = await migrateHousehold(countryId, v1Sim.population_id);
      if (!householdResult.success) {
        errors.push({
          stage: 'household',
          v1Id: v1Sim.population_id,
          message: householdResult.error ?? 'Unknown household migration error',
        });
        return {
          success: false,
          v1UserAssociationId: userReportId,
          v2Ids: { dependencyIds: { policyId: policyResult.v2Id ?? null } },
          errors,
        };
      }
      v2PopulationId = householdResult.v2Id ?? null;
    } else {
      const geoResult = migrateGeography(countryId, v1Sim.population_id);
      v2PopulationId = geoResult.v2Id ?? null;
    }

    // Step 5: Create v2 report via analysis endpoint
    let v2ReportId: string;
    let v2SimIds: string[] = [];

    if (isHousehold) {
      const analysis = await createHouseholdAnalysis({
        household_id: v2PopulationId!,
        policy_id: policyResult.v2Id ?? undefined,
      });
      v2ReportId = analysis.report_id;
      if (analysis.baseline_simulation) {
        v2SimIds.push(analysis.baseline_simulation.id);
      }
      if (analysis.reform_simulation) {
        v2SimIds.push(analysis.reform_simulation.id);
      }
    } else {
      const modelName = getModelName(countryId);
      const analysis = await createEconomyAnalysis({
        tax_benefit_model_name: modelName,
        region: v2PopulationId,
        policy_id: policyResult.v2Id ?? undefined,
      });
      v2ReportId = analysis.report_id;
      v2SimIds = [analysis.baseline_simulation.id, analysis.reform_simulation.id];
    }

    // Step 6: Create v2 user-report association
    const outputType = isHousehold ? 'household' : 'economy';
    const assocResult = await migrateUserReportAssociation(
      v2ReportId,
      userId,
      countryId,
      label
    );

    if (!assocResult.success) {
      errors.push({
        stage: 'user-report-association',
        v1Id: userReportId,
        message: assocResult.error ?? 'Unknown association error',
      });
    }

    // Step 7: Create user-simulation associations for the new v2 sims
    for (const simId of v2SimIds) {
      await migrateUserSimulationAssociation(simId, userId, countryId);
    }

    return {
      success: errors.length === 0,
      v1UserAssociationId: userReportId,
      v2Ids: {
        baseEntityId: v2ReportId,
        userAssociationId: assocResult.v2Id ?? undefined,
        dependencyIds: {
          policyId: policyResult.v2Id ?? null,
          populationId: v2PopulationId,
          outputType,
          ...Object.fromEntries(v2SimIds.map((id, i) => [`simulationId_${i}`, id])),
        },
      },
      errors,
    };
  } catch (err) {
    errors.push({
      stage: 'report-orchestrator',
      v1Id: reportId,
      message: err instanceof Error ? err.message : String(err),
    });

    return {
      success: false,
      v1UserAssociationId: userReportId,
      v2Ids: {},
      errors,
    };
  }
}

// ============================================================================
// Top-Level Migration Runner
// ============================================================================

/**
 * Migrate all v1 reports for a user.
 *
 * Detects v1 reports, then migrates each sequentially to avoid
 * overwhelming the API. Calls onProgress after each report.
 */
export async function migrateAllV1Reports(
  userId: string,
  onProgress?: (progress: MigrationProgress) => void
): Promise<MigrationRunResult> {
  const v1Reports = detectV1Reports(userId);

  const result: MigrationRunResult = {
    total: v1Reports.length,
    succeeded: [],
    failed: [],
  };

  for (let i = 0; i < v1Reports.length; i++) {
    const reportInfo = v1Reports[i];

    onProgress?.({
      current: i + 1,
      total: v1Reports.length,
      currentLabel: reportInfo.label,
    });

    const orchestratorResult = await orchestrateReportMigration(reportInfo, userId);

    if (orchestratorResult.success) {
      result.succeeded.push(orchestratorResult);
    } else {
      result.failed.push(orchestratorResult);
    }
  }

  return result;
}
