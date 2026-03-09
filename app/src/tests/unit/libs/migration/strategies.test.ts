import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchV1Household, v1ResponseToHousehold } from '@/api/legacyConversion';
// Import mocked modules
import { createPolicy, fetchV1Policy } from '@/api/policy';
import { createHouseholdV2 } from '@/api/v2/households';
import { fetchParametersByName } from '@/api/v2/parameterTree';
import { fetchModelByCountry } from '@/api/v2/taxBenefitModels';
import { createUserHouseholdAssociationV2 } from '@/api/v2/userHouseholdAssociations';
import { createUserPolicyAssociationV2 } from '@/api/v2/userPolicyAssociations';
import { createUserReportAssociationV2 } from '@/api/v2/userReportAssociations';
import { createUserSimulationAssociationV2 } from '@/api/v2/userSimulationAssociations';
import {
  migrateGeography,
  migrateHousehold,
  migratePolicy,
  migrateUserHouseholdAssociation,
  migrateUserPolicyAssociation,
  migrateUserReportAssociation,
  migrateUserSimulationAssociation,
} from '@/libs/migration/strategies';

// Mock all API modules
vi.mock('@/api/policy', () => ({
  fetchV1Policy: vi.fn(),
  createPolicy: vi.fn(),
}));

vi.mock('@/api/legacyConversion', () => ({
  fetchV1Household: vi.fn(),
  v1ResponseToHousehold: vi.fn(),
}));

vi.mock('@/api/v2/households', () => ({
  createHouseholdV2: vi.fn(),
}));

vi.mock('@/api/v2/taxBenefitModels', () => ({
  fetchModelByCountry: vi.fn(),
}));

vi.mock('@/api/v2/parameterTree', () => ({
  fetchParametersByName: vi.fn(),
}));

vi.mock('@/api/v2/userPolicyAssociations', () => ({
  createUserPolicyAssociationV2: vi.fn(),
}));

vi.mock('@/api/v2/userHouseholdAssociations', () => ({
  createUserHouseholdAssociationV2: vi.fn(),
}));

vi.mock('@/api/v2/userSimulationAssociations', () => ({
  createUserSimulationAssociationV2: vi.fn(),
}));

vi.mock('@/api/v2/userReportAssociations', () => ({
  createUserReportAssociationV2: vi.fn(),
}));

const TEST_USER_ID = 'user-abc-123';

describe('strategies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================================================
  // Base Entity Strategies
  // ========================================================================

  describe('migratePolicy', () => {
    test('given null policyId then returns success with null v2Id', async () => {
      const result = await migratePolicy('us', null);

      expect(result).toEqual({ success: true, v2Id: null, v1Id: '' });
      expect(fetchV1Policy).not.toHaveBeenCalled();
    });

    test('given undefined policyId then returns success with null v2Id', async () => {
      const result = await migratePolicy('us', undefined);

      expect(result).toEqual({ success: true, v2Id: null, v1Id: '' });
    });

    test('given valid v1 policy then creates v2 policy with mapped params', async () => {
      vi.mocked(fetchV1Policy).mockResolvedValue({
        'gov.irs.credits.eitc.max[0].rate': { '2025-01-01.2025-12-31': 0.15 },
      });
      vi.mocked(fetchParametersByName).mockResolvedValue([
        {
          id: 'param-uuid-1',
          name: 'gov.irs.credits.eitc.max[0].rate',
          label: 'EITC rate',
          description: null,
          data_type: null,
          unit: null,
          tax_benefit_model_version_id: 'version-1',
          created_at: '2025-01-01',
        },
      ]);
      vi.mocked(fetchModelByCountry).mockResolvedValue({
        model: { id: 'model-uuid-1', name: 'policyengine_us', description: '', created_at: '' },
        latest_version: { id: 'version-1', model_id: 'model-uuid-1', version: '1.0.0' },
      });
      vi.mocked(createPolicy).mockResolvedValue({
        id: 'v2-policy-uuid',
        name: 'Migrated policy (v1 #42)',
        description: null,
        tax_benefit_model_id: 'model-uuid-1',
        created_at: '',
        updated_at: '',
        parameter_values: [],
      });

      const result = await migratePolicy('us', '42');

      expect(result.success).toBe(true);
      expect(result.v2Id).toBe('v2-policy-uuid');
      expect(result.v1Id).toBe('42');
      expect(createPolicy).toHaveBeenCalledWith({
        name: 'Migrated policy (v1 #42)',
        tax_benefit_model_id: 'model-uuid-1',
        parameter_values: [
          {
            parameter_id: 'param-uuid-1',
            value_json: 0.15,
            start_date: '2025-01-01T00:00:00Z',
            end_date: '2025-12-31T00:00:00Z',
          },
        ],
      });
    });

    test('given empty v1 policy then returns success with null v2Id', async () => {
      vi.mocked(fetchV1Policy).mockResolvedValue({});

      const result = await migratePolicy('us', '42');

      expect(result.success).toBe(true);
      expect(result.v2Id).toBeNull();
      expect(createPolicy).not.toHaveBeenCalled();
    });

    test('given fetchV1Policy fails then returns error result', async () => {
      vi.mocked(fetchV1Policy).mockRejectedValue(new Error('API error'));

      const result = await migratePolicy('us', '42');

      expect(result.success).toBe(false);
      expect(result.error).toBe('API error');
      expect(result.v1Id).toBe('42');
    });

    test('given param not found in v2 then skips that param', async () => {
      vi.mocked(fetchV1Policy).mockResolvedValue({
        'unknown.param': { '2025': 100 },
      });
      vi.mocked(fetchParametersByName).mockResolvedValue([]);
      vi.mocked(fetchModelByCountry).mockResolvedValue({
        model: { id: 'model-uuid-1', name: 'policyengine_us', description: '', created_at: '' },
        latest_version: { id: 'version-1', model_id: 'model-uuid-1', version: '1.0.0' },
      });
      vi.mocked(createPolicy).mockResolvedValue({
        id: 'v2-policy-uuid',
        name: '',
        description: null,
        tax_benefit_model_id: 'model-uuid-1',
        created_at: '',
        updated_at: '',
        parameter_values: [],
      });

      const result = await migratePolicy('us', '42');

      expect(result.success).toBe(true);
      expect(createPolicy).toHaveBeenCalledWith(expect.objectContaining({ parameter_values: [] }));
    });
  });

  describe('migrateHousehold', () => {
    test('given valid v1 household then creates v2 household', async () => {
      const v1Data = { people: { you: { age: { '2025': 30 } } } };
      const v2Household = { people: [{ age: 30 }], country_id: 'us', year: 2025 };

      vi.mocked(fetchV1Household).mockResolvedValue(v1Data);
      vi.mocked(v1ResponseToHousehold).mockReturnValue(v2Household as any);
      vi.mocked(createHouseholdV2).mockResolvedValue({ ...v2Household, id: 'v2-hh-uuid' } as any);

      const result = await migrateHousehold('us', '123');

      expect(result.success).toBe(true);
      expect(result.v2Id).toBe('v2-hh-uuid');
      expect(result.v1Id).toBe('123');
      expect(fetchV1Household).toHaveBeenCalledWith('us', '123');
      expect(v1ResponseToHousehold).toHaveBeenCalledWith(v1Data, 'us');
      expect(createHouseholdV2).toHaveBeenCalledWith(v2Household);
    });

    test('given fetchV1Household fails then returns error result', async () => {
      vi.mocked(fetchV1Household).mockRejectedValue(new Error('Not found'));

      const result = await migrateHousehold('us', '999');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not found');
      expect(result.v1Id).toBe('999');
    });
  });

  describe('migrateGeography', () => {
    test('given region code then passes through unchanged', () => {
      const result = migrateGeography('us', 'enhanced_cps');

      expect(result).toEqual({
        success: true,
        v2Id: 'enhanced_cps',
        v1Id: 'enhanced_cps',
      });
    });
  });

  // ========================================================================
  // User Association Strategies
  // ========================================================================

  describe('migrateUserPolicyAssociation', () => {
    test('given valid input then creates v2 association', async () => {
      vi.mocked(createUserPolicyAssociationV2).mockResolvedValue({
        id: 'v2-up-uuid',
        userId: TEST_USER_ID,
        policyId: 'v2-policy-uuid',
        countryId: 'us',
      } as any);

      const result = await migrateUserPolicyAssociation(
        'v2-policy-uuid',
        TEST_USER_ID,
        'us',
        'My policy'
      );

      expect(result.success).toBe(true);
      expect(result.v2Id).toBe('v2-up-uuid');
      expect(createUserPolicyAssociationV2).toHaveBeenCalledWith({
        userId: TEST_USER_ID,
        policyId: 'v2-policy-uuid',
        countryId: 'us',
        label: 'My policy',
      });
    });

    test('given API error then returns failure result', async () => {
      vi.mocked(createUserPolicyAssociationV2).mockRejectedValue(new Error('403 Forbidden'));

      const result = await migrateUserPolicyAssociation('v2-policy-uuid', TEST_USER_ID, 'us');

      expect(result.success).toBe(false);
      expect(result.error).toBe('403 Forbidden');
    });
  });

  describe('migrateUserHouseholdAssociation', () => {
    test('given valid input then creates v2 association', async () => {
      vi.mocked(createUserHouseholdAssociationV2).mockResolvedValue({
        id: 'v2-uh-uuid',
        userId: TEST_USER_ID,
        householdId: 'v2-hh-uuid',
        countryId: 'us',
        type: 'household',
      } as any);

      const result = await migrateUserHouseholdAssociation('v2-hh-uuid', TEST_USER_ID, 'us');

      expect(result.success).toBe(true);
      expect(result.v2Id).toBe('v2-uh-uuid');
    });
  });

  describe('migrateUserSimulationAssociation', () => {
    test('given valid input then creates v2 association', async () => {
      vi.mocked(createUserSimulationAssociationV2).mockResolvedValue({
        id: 'v2-us-uuid',
        userId: TEST_USER_ID,
        simulationId: 'v2-sim-uuid',
        countryId: 'us',
      } as any);

      const result = await migrateUserSimulationAssociation('v2-sim-uuid', TEST_USER_ID, 'us');

      expect(result.success).toBe(true);
      expect(result.v2Id).toBe('v2-us-uuid');
    });
  });

  describe('migrateUserReportAssociation', () => {
    test('given valid input then creates v2 association', async () => {
      vi.mocked(createUserReportAssociationV2).mockResolvedValue({
        id: 'v2-ur-uuid',
        userId: TEST_USER_ID,
        reportId: 'v2-report-uuid',
        countryId: 'us',
      } as any);

      const result = await migrateUserReportAssociation(
        'v2-report-uuid',
        TEST_USER_ID,
        'us',
        'My report'
      );

      expect(result.success).toBe(true);
      expect(result.v2Id).toBe('v2-ur-uuid');
      expect(createUserReportAssociationV2).toHaveBeenCalledWith({
        userId: TEST_USER_ID,
        reportId: 'v2-report-uuid',
        countryId: 'us',
        label: 'My report',
      });
    });
  });
});
