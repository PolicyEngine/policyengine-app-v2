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

// V1 fetch functions
import { fetchReportById } from '@/api/report';
import { fetchSimulationById } from '@/api/simulation';
import { createEconomyAnalysis } from '@/api/v2/economyAnalysis';
// V2 analysis endpoints (create report + simulations server-side)
import { createHouseholdAnalysis } from '@/api/v2/householdAnalysis';
// Cleanup
import { cleanupMigratedRecords } from './cleanup';
// Detection
import { detectV1Reports } from './detect';
// Strategy functions
import {
  migrateGeography,
  migrateHousehold,
  migratePolicy,
  migrateUserReportAssociation,
  migrateUserSimulationAssociation,
} from './strategies';
import type {
  MigrationError,
  MigrationProgress,
  MigrationResult,
  MigrationRunResult,
  OrchestratorResult,
  V1ReportInfo,
} from './types';

const LOG = '[migration:orchestrator]';

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
  const warnings: string[] = [];
  const { countryId, reportId, userReportId, label } = reportInfo;

  console.info(
    `\n${LOG} ========== Migrating report ==========\n` +
      `${LOG} userReportId=${userReportId}, reportId=${reportId}, ` +
      `label="${label ?? '(none)'}", country=${countryId}`
  );

  try {
    // Step 1: Fetch v1 report metadata
    console.info(`${LOG} Step 1: Fetching v1 report ${reportId}...`);
    const v1Report = await fetchReportById(countryId, reportId);
    console.info(
      `${LOG} Step 1: OK — sim1=${v1Report.simulation_1_id}, sim2=${v1Report.simulation_2_id}, ` +
        `status=${v1Report.status}, year=${v1Report.year}`
    );

    // Step 2: Fetch BOTH v1 simulation metadata
    console.info(`${LOG} Step 2: Fetching v1 simulations...`);
    const v1Sim1 = await fetchSimulationById(countryId, v1Report.simulation_1_id);
    console.info(
      `${LOG} Step 2: sim1 — policy_id=${v1Sim1.policy_id}, ` +
        `population_type=${v1Sim1.population_type}, population_id=${v1Sim1.population_id}`
    );
    const v1Sim2 = v1Report.simulation_2_id
      ? await fetchSimulationById(countryId, v1Report.simulation_2_id)
      : null;
    if (v1Sim2) {
      console.info(
        `${LOG} Step 2: sim2 — policy_id=${v1Sim2.policy_id}, ` +
          `population_type=${v1Sim2.population_type}, population_id=${v1Sim2.population_id}`
      );
    } else {
      console.info(`${LOG} Step 2: No sim2 (single-simulation report)`);
    }

    // Step 3: Migrate BOTH policies
    console.info(`${LOG} Step 3: Migrating baseline policy (sim1)...`);
    const baselinePolicyResult = await migratePolicy(countryId, v1Sim1.policy_id);
    if (!baselinePolicyResult.success) {
      console.error(`${LOG} Step 3: baseline policy FAILED — ${baselinePolicyResult.error}`);
      errors.push({
        stage: 'policy',
        v1Id: v1Sim1.policy_id,
        message: baselinePolicyResult.error ?? 'Unknown baseline policy migration error',
      });
      logReportSummary(reportInfo, false, errors);
      return {
        success: false,
        v1UserAssociationId: userReportId,
        v1ReportId: reportId,
        label,
        v2Ids: {},
        errors,
        warnings,
      };
    }
    console.info(
      `${LOG} Step 3: baseline OK — v2PolicyId=${baselinePolicyResult.v2Id ?? '(current law)'}`
    );
    if (baselinePolicyResult.warnings) {
      warnings.push(...baselinePolicyResult.warnings.map((w) => `Baseline policy: ${w}`));
    }

    let reformPolicyResult: MigrationResult = { success: true, v2Id: null, v1Id: '' };
    if (v1Sim2) {
      console.info(`${LOG} Step 3: Migrating reform policy (sim2)...`);
      reformPolicyResult = await migratePolicy(countryId, v1Sim2.policy_id);
      if (!reformPolicyResult.success) {
        console.error(`${LOG} Step 3: reform policy FAILED — ${reformPolicyResult.error}`);
        errors.push({
          stage: 'policy',
          v1Id: v1Sim2.policy_id,
          message: reformPolicyResult.error ?? 'Unknown reform policy migration error',
        });
        logReportSummary(reportInfo, false, errors);
        return {
          success: false,
          v1UserAssociationId: userReportId,
          v1ReportId: reportId,
          label,
          v2Ids: { dependencyIds: { baselinePolicyId: baselinePolicyResult.v2Id ?? null } },
          errors,
          warnings,
        };
      }
      console.info(
        `${LOG} Step 3: reform OK — v2PolicyId=${reformPolicyResult.v2Id ?? '(current law)'}`
      );
      if (reformPolicyResult.warnings) {
        warnings.push(...reformPolicyResult.warnings.map((w) => `Reform policy: ${w}`));
      }
    }

    // Step 4: Migrate population (both sims share the same population)
    const isHousehold = v1Sim1.population_type === 'household';
    let v2PopulationId: string | null = null;

    console.info(`${LOG} Step 4: Migrating population (type=${v1Sim1.population_type})...`);
    if (isHousehold) {
      const householdResult = await migrateHousehold(countryId, v1Sim1.population_id);
      if (!householdResult.success) {
        console.error(`${LOG} Step 4: FAILED — ${householdResult.error}`);
        errors.push({
          stage: 'household',
          v1Id: v1Sim1.population_id,
          message: householdResult.error ?? 'Unknown household migration error',
        });
        logReportSummary(reportInfo, false, errors);
        return {
          success: false,
          v1UserAssociationId: userReportId,
          v1ReportId: reportId,
          label,
          v2Ids: {
            dependencyIds: {
              baselinePolicyId: baselinePolicyResult.v2Id ?? null,
              reformPolicyId: reformPolicyResult.v2Id ?? null,
            },
          },
          errors,
          warnings,
        };
      }
      v2PopulationId = householdResult.v2Id ?? null;
    } else {
      const geoResult = migrateGeography(countryId, v1Sim1.population_id);
      v2PopulationId = geoResult.v2Id ?? null;
    }
    console.info(`${LOG} Step 4: OK — v2PopulationId=${v2PopulationId}`);

    // Step 5: Create v2 report via analysis endpoint (with both policy IDs + year)
    let v2ReportId: string;
    let v2SimIds: string[] = [];

    console.info(
      `${LOG} Step 5: Creating v2 analysis (${isHousehold ? 'household' : 'economy'})...`
    );
    if (isHousehold) {
      const analysis = await createHouseholdAnalysis({
        household_id: v2PopulationId!,
        baseline_policy_id: baselinePolicyResult.v2Id ?? 'current_law',
        reform_policy_id: reformPolicyResult.v2Id ?? 'current_law',
        run: false,
      });
      v2ReportId = analysis.report_id;
      if (analysis.baseline_simulation) {
        v2SimIds.push(analysis.baseline_simulation.id);
      }
      if (analysis.reform_simulation) {
        v2SimIds.push(analysis.reform_simulation.id);
      }
    } else {
      const analysis = await createEconomyAnalysis({
        country_id: countryId,
        region: v2PopulationId,
        baseline_policy_id: baselinePolicyResult.v2Id ?? 'current_law',
        reform_policy_id: reformPolicyResult.v2Id ?? 'current_law',
        year: parseInt(v1Report.year, 10),
        run: false,
      });
      v2ReportId = analysis.report_id;
      v2SimIds = [analysis.baseline_simulation.id, analysis.reform_simulation.id];
    }
    console.info(`${LOG} Step 5: OK — v2ReportId=${v2ReportId}, v2SimIds=[${v2SimIds.join(', ')}]`);

    // Step 6: Create v2 user-report association
    const outputType = isHousehold ? 'household' : 'economy';
    console.info(`${LOG} Step 6: Creating user-report association...`);
    const assocResult = await migrateUserReportAssociation(v2ReportId, userId, countryId, label);

    if (!assocResult.success) {
      console.error(`${LOG} Step 6: FAILED — ${assocResult.error}`);
      errors.push({
        stage: 'user-report-association',
        v1Id: userReportId,
        message: assocResult.error ?? 'Unknown association error',
      });
    } else {
      console.info(`${LOG} Step 6: OK — userReportAssocId=${assocResult.v2Id}`);
    }

    // Step 7: Create user-simulation associations for the new v2 sims
    console.info(`${LOG} Step 7: Creating ${v2SimIds.length} user-simulation association(s)...`);
    for (const simId of v2SimIds) {
      const simAssocResult = await migrateUserSimulationAssociation(simId, userId, countryId);
      if (!simAssocResult.success) {
        console.warn(`${LOG} Step 7: user-sim association failed for sim=${simId} (non-fatal)`);
      }
    }
    console.info(`${LOG} Step 7: Done`);

    const success = errors.length === 0;
    const result: OrchestratorResult = {
      success,
      v1UserAssociationId: userReportId,
      v1ReportId: reportId,
      label,
      v2Ids: {
        baseEntityId: v2ReportId,
        userAssociationId: assocResult.v2Id ?? undefined,
        dependencyIds: {
          baselinePolicyId: baselinePolicyResult.v2Id ?? null,
          reformPolicyId: reformPolicyResult.v2Id ?? null,
          populationId: v2PopulationId,
          outputType,
          ...Object.fromEntries(v2SimIds.map((id, i) => [`simulationId_${i}`, id])),
        },
      },
      errors,
      warnings,
    };

    logReportSummary(reportInfo, success, errors, result);
    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`${LOG} UNEXPECTED ERROR: ${msg}`);
    errors.push({
      stage: 'report-orchestrator',
      v1Id: reportId,
      message: msg,
    });

    logReportSummary(reportInfo, false, errors);
    return {
      success: false,
      v1UserAssociationId: userReportId,
      v1ReportId: reportId,
      label,
      v2Ids: {},
      errors,
      warnings,
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
  console.info(`\n${LOG} ============================================================`);
  console.info(`${LOG} Starting migration for userId=${userId}`);
  console.info(`${LOG} ============================================================`);

  const v1Reports = detectV1Reports(userId);

  if (v1Reports.length === 0) {
    console.info(`${LOG} No v1 reports found. Nothing to migrate.`);
    return { total: 0, succeeded: [], failed: [] };
  }

  console.info(`${LOG} Found ${v1Reports.length} v1 report(s) to migrate`);

  const result: MigrationRunResult = {
    total: v1Reports.length,
    succeeded: [],
    failed: [],
  };

  for (let i = 0; i < v1Reports.length; i++) {
    const reportInfo = v1Reports[i];

    console.info(
      `\n${LOG} --- Report ${i + 1}/${v1Reports.length}: "${reportInfo.label ?? reportInfo.reportId}" ---`
    );

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

  // Final summary
  console.info(`\n${LOG} ============================================================`);
  console.info(`${LOG} MIGRATION COMPLETE`);
  console.info(`${LOG}   Total:     ${result.total}`);
  console.info(`${LOG}   Succeeded: ${result.succeeded.length}`);
  console.info(`${LOG}   Failed:    ${result.failed.length}`);
  if (result.failed.length > 0) {
    console.info(`${LOG}   Failed reports:`);
    for (const f of result.failed) {
      console.info(
        `${LOG}     - v1Id=${f.v1UserAssociationId}: ${f.errors.map((e) => `[${e.stage}] ${e.message}`).join('; ')}`
      );
    }
  }
  // Clean up successfully-migrated v1 records from localStorage
  if (result.succeeded.length > 0) {
    const cleanup = cleanupMigratedRecords(result);
    console.info(
      `${LOG} Cleanup: ${cleanup.removedReports} report(s), ${cleanup.removedSimulations} sim(s), ${cleanup.removedPolicies} policy(ies), ${cleanup.removedHouseholds} household(s) removed from localStorage`
    );
  }
  console.info(`${LOG} ============================================================\n`);

  return result;
}

// ============================================================================
// Helpers
// ============================================================================

function logReportSummary(
  reportInfo: V1ReportInfo,
  success: boolean,
  errors: MigrationError[],
  result?: OrchestratorResult
) {
  const status = success ? 'SUCCESS' : 'FAILED';
  console.info(`\n${LOG} ---------- Report migration ${status} ----------`);
  console.info(
    `${LOG} v1: userReportId=${reportInfo.userReportId}, reportId=${reportInfo.reportId}, ` +
      `label="${reportInfo.label ?? '(none)'}"`
  );

  if (success && result) {
    console.info(`${LOG} v2: reportId=${result.v2Ids.baseEntityId}`);
    console.info(`${LOG}     userAssocId=${result.v2Ids.userAssociationId}`);
    if (result.v2Ids.dependencyIds) {
      console.info(
        `${LOG}     baselinePolicyId=${result.v2Ids.dependencyIds.baselinePolicyId ?? '(current law)'}`
      );
      console.info(
        `${LOG}     reformPolicyId=${result.v2Ids.dependencyIds.reformPolicyId ?? '(current law)'}`
      );
      console.info(`${LOG}     populationId=${result.v2Ids.dependencyIds.populationId}`);
      console.info(`${LOG}     outputType=${result.v2Ids.dependencyIds.outputType}`);
    }
  }

  if (errors.length > 0) {
    console.info(`${LOG} Errors (${errors.length}):`);
    for (const e of errors) {
      console.info(`${LOG}   [${e.stage}] ${e.message} (v1Id=${e.v1Id})`);
    }
  }
  console.info(`${LOG} -----------------------------------------------\n`);
}
