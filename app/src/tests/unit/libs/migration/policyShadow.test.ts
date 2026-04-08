import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createPolicyV2 } from '@/api/v2';
import { fetchParametersByName } from '@/api/v2/parameterTree';
import { fetchModelByCountry } from '@/api/v2/taxBenefitModels';
import { createUserPolicyAssociationV2 } from '@/api/v2/userPolicyAssociations';
import { logMigrationComparison } from '@/libs/migration/comparisonLogger';
import { getV2Id, setV2Id } from '@/libs/migration/idMapping';
import {
  buildV2PolicyCreateRequest,
  shadowCreatePolicyAndAssociation,
} from '@/libs/migration/policyShadow';
import type { UserPolicy } from '@/types/ingredients/UserPolicy';
import type { PolicyCreationPayload } from '@/types/payloads';

vi.mock('@/api/v2', () => ({
  createPolicyV2: vi.fn(),
}));

vi.mock('@/api/v2/parameterTree', () => ({
  fetchParametersByName: vi.fn(),
}));

vi.mock('@/api/v2/taxBenefitModels', () => ({
  fetchModelByCountry: vi.fn(),
}));

vi.mock('@/api/v2/userPolicyAssociations', () => ({
  createUserPolicyAssociationV2: vi.fn(),
  updateUserPolicyAssociationV2: vi.fn(),
}));

vi.mock('@/libs/migration/comparisonLogger', () => ({
  logMigrationComparison: vi.fn(),
}));

const TEST_COUNTRY_ID = 'us';
const TEST_V1_POLICY_ID = '42';
const TEST_V2_POLICY_ID = '880e8400-e29b-41d4-a716-446655440003';
const TEST_MODEL_ID = '550e8400-e29b-41d4-a716-446655440000';
const TEST_MODEL_VERSION_ID = '660e8400-e29b-41d4-a716-446655440001';
const TEST_PARAMETER_ID = 'cc0e8400-e29b-41d4-a716-446655440007';
const TEST_V1_USER_ID = 'anonymous';
const TEST_V2_USER_ID = 'c93a763d-8d9f-4ab8-b04f-2fbba0183f35';
const TEST_V1_ASSOC_ID = 'sup-abc123';
const TEST_V2_ASSOC_ID = 'dd0e8400-e29b-41d4-a716-446655440008';

const policyPayload: PolicyCreationPayload = {
  data: {
    'gov.irs.credits.ctc.amount': {
      '2026-01-01.2100-12-31': 2000,
    },
  },
};

const v1Association: UserPolicy = {
  id: TEST_V1_ASSOC_ID,
  userId: TEST_V1_USER_ID,
  policyId: TEST_V1_POLICY_ID,
  countryId: TEST_COUNTRY_ID,
  label: 'My reform',
  createdAt: '2026-04-02T12:00:00Z',
  isCreated: true,
};

const v2PolicyResponse = {
  id: TEST_V2_POLICY_ID,
  name: 'My reform',
  description: null,
  tax_benefit_model_id: TEST_MODEL_ID,
  created_at: '2026-04-02T12:00:01Z',
  updated_at: '2026-04-02T12:00:01Z',
  parameter_values: [
    {
      id: 'pv-1',
      parameter_id: TEST_PARAMETER_ID,
      parameter_name: 'gov.irs.credits.ctc.amount',
      value_json: 2000,
      start_date: '2026-01-01T00:00:00Z',
      end_date: null,
      policy_id: TEST_V2_POLICY_ID,
      dynamic_id: null,
      created_at: '2026-04-02T12:00:01Z',
    },
  ],
};

describe('policyShadow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    vi.mocked(fetchModelByCountry).mockResolvedValue({
      model: {
        id: TEST_MODEL_ID,
        name: 'policyengine-us',
        description: 'US tax-benefit model',
        created_at: '2026-04-02T12:00:00Z',
      },
      latest_version: {
        id: TEST_MODEL_VERSION_ID,
        model_id: TEST_MODEL_ID,
        version: '1.0.0',
      },
    });
    vi.mocked(fetchParametersByName).mockResolvedValue([
      {
        id: TEST_PARAMETER_ID,
        name: 'gov.irs.credits.ctc.amount',
        label: 'CTC amount',
        description: null,
        data_type: 'float',
        unit: 'currency-USD',
        tax_benefit_model_version_id: TEST_MODEL_VERSION_ID,
        created_at: '2026-04-02T12:00:00Z',
      },
    ]);
    vi.mocked(createPolicyV2).mockResolvedValue(v2PolicyResponse);
    vi.mocked(createUserPolicyAssociationV2).mockResolvedValue({
      id: TEST_V2_ASSOC_ID,
      userId: TEST_V2_USER_ID,
      policyId: TEST_V2_POLICY_ID,
      countryId: TEST_COUNTRY_ID,
      label: 'My reform',
      createdAt: '2026-04-02T12:00:01Z',
      updatedAt: '2026-04-02T12:00:01Z',
      isCreated: true,
    });
    setV2Id('User', TEST_V1_USER_ID, TEST_V2_USER_ID);
  });

  test('given v1 policy payload then builds a v2 policy create request matching API contract', async () => {
    const result = await buildV2PolicyCreateRequest(
      TEST_V1_POLICY_ID,
      TEST_COUNTRY_ID,
      policyPayload,
      'My reform'
    );

    expect(fetchParametersByName).toHaveBeenCalledWith(
      ['gov.irs.credits.ctc.amount'],
      TEST_COUNTRY_ID,
      TEST_MODEL_VERSION_ID
    );
    expect(result.payload).toEqual({
      name: 'My reform',
      description: null,
      tax_benefit_model_id: TEST_MODEL_ID,
      parameter_values: [
        {
          parameter_id: TEST_PARAMETER_ID,
          value_json: 2000,
          start_date: '2026-01-01T00:00:00Z',
          end_date: null,
        },
      ],
    });
  });

  test('given missing v2 parameter metadata then rejects before creating policy', async () => {
    vi.mocked(fetchParametersByName).mockResolvedValue([]);

    await expect(
      buildV2PolicyCreateRequest(TEST_V1_POLICY_ID, TEST_COUNTRY_ID, policyPayload, 'My reform')
    ).rejects.toThrow('Missing v2 parameter IDs for: gov.irs.credits.ctc.amount');
  });

  test('given successful v2 policy create then stores policy and user-policy mappings', async () => {
    await shadowCreatePolicyAndAssociation({
      countryId: TEST_COUNTRY_ID,
      label: 'My reform',
      v1PolicyId: TEST_V1_POLICY_ID,
      v1PolicyPayload: policyPayload,
      v1Association,
    });

    expect(createPolicyV2).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'My reform',
        tax_benefit_model_id: TEST_MODEL_ID,
      })
    );
    expect(createUserPolicyAssociationV2).toHaveBeenCalledWith({
      userId: TEST_V2_USER_ID,
      policyId: TEST_V2_POLICY_ID,
      countryId: TEST_COUNTRY_ID,
      label: 'My reform',
    });
    expect(getV2Id('Policy', TEST_V1_POLICY_ID)).toBe(TEST_V2_POLICY_ID);
    expect(getV2Id('UserPolicy', TEST_V1_ASSOC_ID)).toBe(TEST_V2_ASSOC_ID);
  });

  test('given successful v2 policy create then logs policy and user-policy comparisons', async () => {
    await shadowCreatePolicyAndAssociation({
      countryId: TEST_COUNTRY_ID,
      label: 'My reform',
      v1PolicyId: TEST_V1_POLICY_ID,
      v1PolicyPayload: policyPayload,
      v1Association,
    });

    expect(logMigrationComparison).toHaveBeenCalledWith(
      'PolicyMigration',
      'CREATE',
      expect.any(Object),
      expect.any(Object),
      { skipFields: ['id'] }
    );
    expect(logMigrationComparison).toHaveBeenCalledWith(
      'UserPolicyMigration',
      'CREATE',
      expect.any(Object),
      expect.any(Object),
      { skipFields: ['id', 'createdAt', 'updatedAt', 'isCreated'] }
    );
  });

  test('given v2 policy create fails then it does not throw or create user-policy association', async () => {
    vi.mocked(createPolicyV2).mockRejectedValue(new Error('v2 unavailable'));
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    await expect(
      shadowCreatePolicyAndAssociation({
        countryId: TEST_COUNTRY_ID,
        label: 'My reform',
        v1PolicyId: TEST_V1_POLICY_ID,
        v1PolicyPayload: policyPayload,
        v1Association,
      })
    ).resolves.toBeUndefined();

    expect(createUserPolicyAssociationV2).not.toHaveBeenCalled();
    expect(infoSpy).toHaveBeenCalledWith(
      expect.stringContaining('[PolicyMigration] Shadow v2 policy create failed'),
      expect.any(Error)
    );
  });
});
