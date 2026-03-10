import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchReportById } from '@/api/report';
import { fetchSimulationById } from '@/api/simulation';
import { createEconomyAnalysis } from '@/api/v2/economyAnalysis';
import { createHouseholdAnalysis } from '@/api/v2/householdAnalysis';
import { detectV1Reports } from '@/libs/migration/detect';
import { migrateAllV1Reports, orchestrateReportMigration } from '@/libs/migration/orchestrators';
import {
  migrateGeography,
  migrateHousehold,
  migratePolicy,
  migrateUserReportAssociation,
  migrateUserSimulationAssociation,
} from '@/libs/migration/strategies';
import type { V1ReportInfo } from '@/libs/migration/types';

// Mock all dependencies
vi.mock('@/api/report', () => ({
  fetchReportById: vi.fn(),
}));

vi.mock('@/api/simulation', () => ({
  fetchSimulationById: vi.fn(),
}));

vi.mock('@/api/v2/householdAnalysis', () => ({
  createHouseholdAnalysis: vi.fn(),
}));

vi.mock('@/api/v2/economyAnalysis', () => ({
  createEconomyAnalysis: vi.fn(),
}));

// getModelName no longer used by orchestrators (they pass country_id directly)
vi.mock('@/api/v2/taxBenefitModels', () => ({
  getModelName: vi.fn().mockReturnValue('policyengine-us'),
}));

vi.mock('@/libs/migration/strategies', () => ({
  migratePolicy: vi.fn(),
  migrateHousehold: vi.fn(),
  migrateGeography: vi.fn(),
  migrateUserReportAssociation: vi.fn(),
  migrateUserSimulationAssociation: vi.fn(),
}));

vi.mock('@/libs/migration/detect', () => ({
  detectV1Reports: vi.fn(),
}));

const TEST_USER_ID = 'user-abc-123';

const HOUSEHOLD_REPORT_INFO: V1ReportInfo = {
  userReportId: 'ur-v1-001',
  reportId: '42',
  label: 'My household report',
  countryId: 'us',
};

const ECONOMY_REPORT_INFO: V1ReportInfo = {
  userReportId: 'ur-v1-002',
  reportId: '99',
  label: 'My economy report',
  countryId: 'us',
};

describe('orchestrators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('orchestrateReportMigration', () => {
    test('given household report then migrates policy, household, and creates analysis', async () => {
      // V1 report metadata
      vi.mocked(fetchReportById).mockResolvedValue({
        id: 42,
        country_id: 'us',
        simulation_1_id: '100',
        simulation_2_id: '101',
        year: '2025',
        api_version: 'v1',
        status: 'complete',
        output: null,
      });

      // V1 simulation metadata (sim1 = baseline, sim2 = reform)
      vi.mocked(fetchSimulationById)
        .mockResolvedValueOnce({
          id: 100,
          country_id: 'us',
          api_version: 'v1',
          population_id: '50',
          population_type: 'household',
          policy_id: '30',
        })
        .mockResolvedValueOnce({
          id: 101,
          country_id: 'us',
          api_version: 'v1',
          population_id: '50',
          population_type: 'household',
          policy_id: '31',
        });

      // Strategy mocks (baseline + reform policies)
      vi.mocked(migratePolicy)
        .mockResolvedValueOnce({
          success: true,
          v2Id: 'v2-baseline-policy-uuid',
          v1Id: '30',
        })
        .mockResolvedValueOnce({
          success: true,
          v2Id: 'v2-reform-policy-uuid',
          v1Id: '31',
        });
      vi.mocked(migrateHousehold).mockResolvedValue({
        success: true,
        v2Id: 'v2-hh-uuid',
        v1Id: '50',
      });

      // Analysis endpoint
      vi.mocked(createHouseholdAnalysis).mockResolvedValue({
        report_id: 'v2-report-uuid',
        report_type: 'household_impact',
        status: 'pending',
        baseline_simulation: { id: 'v2-sim-base', status: 'pending', error_message: null },
        reform_simulation: { id: 'v2-sim-reform', status: 'pending', error_message: null },
        baseline_result: null,
        reform_result: null,
        impact: null,
        error_message: null,
      });

      // Association mock
      vi.mocked(migrateUserReportAssociation).mockResolvedValue({
        success: true,
        v2Id: 'v2-ur-uuid',
        v1Id: 'v2-report-uuid',
      });
      vi.mocked(migrateUserSimulationAssociation).mockResolvedValue({
        success: true,
        v2Id: 'v2-us-uuid',
        v1Id: 'v2-sim-base',
      });

      const result = await orchestrateReportMigration(HOUSEHOLD_REPORT_INFO, TEST_USER_ID);

      expect(result.success).toBe(true);
      expect(result.v1UserAssociationId).toBe('ur-v1-001');
      expect(result.v2Ids.baseEntityId).toBe('v2-report-uuid');
      expect(result.errors).toHaveLength(0);

      expect(migratePolicy).toHaveBeenCalledTimes(2);
      expect(migratePolicy).toHaveBeenNthCalledWith(1, 'us', '30');
      expect(migratePolicy).toHaveBeenNthCalledWith(2, 'us', '31');
      expect(migrateHousehold).toHaveBeenCalledWith('us', '50');
      expect(createHouseholdAnalysis).toHaveBeenCalledWith({
        household_id: 'v2-hh-uuid',
        baseline_policy_id: 'v2-baseline-policy-uuid',
        reform_policy_id: 'v2-reform-policy-uuid',
      });
      expect(migrateUserReportAssociation).toHaveBeenCalledWith(
        'v2-report-uuid',
        TEST_USER_ID,
        'us',
        'My household report'
      );
      // Should create user-sim associations for both sims
      expect(migrateUserSimulationAssociation).toHaveBeenCalledTimes(2);
    });

    test('given economy report then uses economy analysis endpoint', async () => {
      vi.mocked(fetchReportById).mockResolvedValue({
        id: 99,
        country_id: 'us',
        simulation_1_id: '200',
        simulation_2_id: '201',
        year: '2025',
        api_version: 'v1',
        status: 'complete',
        output: null,
      });

      // V1 simulations (sim1 = baseline, sim2 = reform)
      vi.mocked(fetchSimulationById)
        .mockResolvedValueOnce({
          id: 200,
          country_id: 'us',
          api_version: 'v1',
          population_id: 'enhanced_cps',
          population_type: 'geography',
          policy_id: '30',
        })
        .mockResolvedValueOnce({
          id: 201,
          country_id: 'us',
          api_version: 'v1',
          population_id: 'enhanced_cps',
          population_type: 'geography',
          policy_id: '31',
        });

      vi.mocked(migratePolicy)
        .mockResolvedValueOnce({
          success: true,
          v2Id: 'v2-baseline-policy-uuid',
          v1Id: '30',
        })
        .mockResolvedValueOnce({
          success: true,
          v2Id: 'v2-reform-policy-uuid',
          v1Id: '31',
        });
      vi.mocked(migrateGeography).mockReturnValue({
        success: true,
        v2Id: 'enhanced_cps',
        v1Id: 'enhanced_cps',
      });

      vi.mocked(createEconomyAnalysis).mockResolvedValue({
        report_id: 'v2-econ-report-uuid',
        status: 'pending',
        baseline_simulation: { id: 'v2-econ-sim-base', status: 'pending', error_message: null },
        reform_simulation: { id: 'v2-econ-sim-reform', status: 'pending', error_message: null },
        region: null,
        error_message: null,
        decile_impacts: null,
        program_statistics: null,
        poverty: null,
        inequality: null,
        budget_summary: null,
        intra_decile: null,
        detailed_budget: null,
        congressional_district_impact: null,
        constituency_impact: null,
        local_authority_impact: null,
        wealth_decile: null,
        intra_wealth_decile: null,
      });

      vi.mocked(migrateUserReportAssociation).mockResolvedValue({
        success: true,
        v2Id: 'v2-ur-uuid',
        v1Id: 'v2-econ-report-uuid',
      });
      vi.mocked(migrateUserSimulationAssociation).mockResolvedValue({
        success: true,
        v2Id: 'v2-us-uuid',
        v1Id: 'any',
      });

      const result = await orchestrateReportMigration(ECONOMY_REPORT_INFO, TEST_USER_ID);

      expect(result.success).toBe(true);
      expect(createEconomyAnalysis).toHaveBeenCalledWith({
        country_id: 'us',
        region: 'enhanced_cps',
        baseline_policy_id: 'v2-baseline-policy-uuid',
        reform_policy_id: 'v2-reform-policy-uuid',
        year: 2025,
      });
    });

    test('given policy migration fails then returns failure with error', async () => {
      vi.mocked(fetchReportById).mockResolvedValue({
        id: 42,
        country_id: 'us',
        simulation_1_id: '100',
        simulation_2_id: null,
        year: '2025',
        api_version: 'v1',
        status: 'complete',
        output: null,
      });

      vi.mocked(fetchSimulationById).mockResolvedValue({
        id: 100,
        country_id: 'us',
        api_version: 'v1',
        population_id: '50',
        population_type: 'household',
        policy_id: '30',
      });

      vi.mocked(migratePolicy).mockResolvedValue({
        success: false,
        v1Id: '30',
        error: 'Policy not found',
      });

      const result = await orchestrateReportMigration(HOUSEHOLD_REPORT_INFO, TEST_USER_ID);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].stage).toBe('policy');
      expect(result.errors[0].message).toBe('Policy not found');
      // Should not attempt household migration or analysis
      expect(migrateHousehold).not.toHaveBeenCalled();
      expect(createHouseholdAnalysis).not.toHaveBeenCalled();
    });

    test('given household migration fails then returns failure with error', async () => {
      vi.mocked(fetchReportById).mockResolvedValue({
        id: 42,
        country_id: 'us',
        simulation_1_id: '100',
        simulation_2_id: null,
        year: '2025',
        api_version: 'v1',
        status: 'complete',
        output: null,
      });

      vi.mocked(fetchSimulationById).mockResolvedValue({
        id: 100,
        country_id: 'us',
        api_version: 'v1',
        population_id: '50',
        population_type: 'household',
        policy_id: '30',
      });

      vi.mocked(migratePolicy).mockResolvedValue({
        success: true,
        v2Id: 'v2-policy-uuid',
        v1Id: '30',
      });
      vi.mocked(migrateHousehold).mockResolvedValue({
        success: false,
        v1Id: '50',
        error: 'Household fetch failed',
      });

      const result = await orchestrateReportMigration(HOUSEHOLD_REPORT_INFO, TEST_USER_ID);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].stage).toBe('household');
      expect(result.v2Ids.dependencyIds?.baselinePolicyId).toBe('v2-policy-uuid');
    });

    test('given fetchReportById throws then catches and reports error', async () => {
      vi.mocked(fetchReportById).mockRejectedValue(new Error('Network error'));

      const result = await orchestrateReportMigration(HOUSEHOLD_REPORT_INFO, TEST_USER_ID);

      expect(result.success).toBe(false);
      expect(result.errors[0].stage).toBe('report-orchestrator');
      expect(result.errors[0].message).toBe('Network error');
    });
  });

  describe('migrateAllV1Reports', () => {
    test('given no v1 reports then returns empty result', async () => {
      vi.mocked(detectV1Reports).mockReturnValue([]);

      const result = await migrateAllV1Reports(TEST_USER_ID);

      expect(result.total).toBe(0);
      expect(result.succeeded).toHaveLength(0);
      expect(result.failed).toHaveLength(0);
    });

    test('given v1 reports then migrates each and calls progress callback', async () => {
      vi.mocked(detectV1Reports).mockReturnValue([HOUSEHOLD_REPORT_INFO, ECONOMY_REPORT_INFO]);

      // Mock the full flow for both reports to succeed
      vi.mocked(fetchReportById).mockResolvedValue({
        id: 42,
        country_id: 'us',
        simulation_1_id: '100',
        simulation_2_id: null,
        year: '2025',
        api_version: 'v1',
        status: 'complete',
        output: null,
      });
      vi.mocked(fetchSimulationById).mockResolvedValue({
        id: 100,
        country_id: 'us',
        api_version: 'v1',
        population_id: '50',
        population_type: 'household',
        policy_id: '30',
      });
      vi.mocked(migratePolicy).mockResolvedValue({ success: true, v2Id: 'v2p', v1Id: '30' });
      vi.mocked(migrateHousehold).mockResolvedValue({ success: true, v2Id: 'v2h', v1Id: '50' });
      vi.mocked(createHouseholdAnalysis).mockResolvedValue({
        report_id: 'v2r',
        report_type: 'household_impact',
        status: 'pending',
        baseline_simulation: { id: 'bs', status: 'pending', error_message: null },
        reform_simulation: { id: 'rs', status: 'pending', error_message: null },
        baseline_result: null,
        reform_result: null,
        impact: null,
        error_message: null,
      });
      vi.mocked(migrateUserReportAssociation).mockResolvedValue({
        success: true,
        v2Id: 'v2ur',
        v1Id: 'v2r',
      });
      vi.mocked(migrateUserSimulationAssociation).mockResolvedValue({
        success: true,
        v2Id: 'v2us',
        v1Id: 'any',
      });

      const progressCalls: any[] = [];
      const result = await migrateAllV1Reports(TEST_USER_ID, (p) => progressCalls.push({ ...p }));

      expect(result.total).toBe(2);
      expect(result.succeeded).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
      expect(progressCalls).toHaveLength(2);
      expect(progressCalls[0]).toEqual({
        current: 1,
        total: 2,
        currentLabel: 'My household report',
      });
      expect(progressCalls[1]).toEqual({
        current: 2,
        total: 2,
        currentLabel: 'My economy report',
      });
    });

    test('given mixed success and failure then categorizes correctly', async () => {
      vi.mocked(detectV1Reports).mockReturnValue([HOUSEHOLD_REPORT_INFO, ECONOMY_REPORT_INFO]);

      // First report succeeds
      vi.mocked(fetchReportById)
        .mockResolvedValueOnce({
          id: 42,
          country_id: 'us',
          simulation_1_id: '100',
          simulation_2_id: null,
          year: '2025',
          api_version: 'v1',
          status: 'complete',
          output: null,
        })
        // Second report fails
        .mockRejectedValueOnce(new Error('Report not found'));

      vi.mocked(fetchSimulationById).mockResolvedValue({
        id: 100,
        country_id: 'us',
        api_version: 'v1',
        population_id: '50',
        population_type: 'household',
        policy_id: '30',
      });
      vi.mocked(migratePolicy).mockResolvedValue({ success: true, v2Id: 'v2p', v1Id: '30' });
      vi.mocked(migrateHousehold).mockResolvedValue({ success: true, v2Id: 'v2h', v1Id: '50' });
      vi.mocked(createHouseholdAnalysis).mockResolvedValue({
        report_id: 'v2r',
        report_type: 'household_impact',
        status: 'pending',
        baseline_simulation: { id: 'bs', status: 'pending', error_message: null },
        reform_simulation: { id: 'rs', status: 'pending', error_message: null },
        baseline_result: null,
        reform_result: null,
        impact: null,
        error_message: null,
      });
      vi.mocked(migrateUserReportAssociation).mockResolvedValue({
        success: true,
        v2Id: 'v2ur',
        v1Id: 'v2r',
      });
      vi.mocked(migrateUserSimulationAssociation).mockResolvedValue({
        success: true,
        v2Id: 'v2us',
        v1Id: 'any',
      });

      const result = await migrateAllV1Reports(TEST_USER_ID);

      expect(result.total).toBe(2);
      expect(result.succeeded).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].errors[0].message).toBe('Report not found');
    });
  });
});
