import { describe, expect, it } from 'vitest';
import { Policy } from '@/models/Policy';
import {
  createMockCurrentLawPolicyData,
  createMockPolicyData,
  createMockV2PolicyResponse,
  createMockV2PolicyResponseNoParams,
  TEST_API_VERSION,
  TEST_COUNTRY_ID,
  TEST_ID,
  TEST_LABEL,
  TEST_PARAMETER_NAMES,
  TEST_POLICY_IDS,
} from '@/tests/fixtures/models/shared';

describe('Policy', () => {
  // ========================================================================
  // Constructor
  // ========================================================================

  describe('constructor', () => {
    it('given valid PolicyData then sets all readonly props and private fields', () => {
      // Given
      const data = createMockPolicyData();

      // When
      const policy = new Policy(data);

      // Then
      expect(policy.id).toBe(TEST_ID);
      expect(policy.countryId).toBe(TEST_COUNTRY_ID);
      expect(policy.apiVersion).toBe(TEST_API_VERSION);
      expect(policy.isCreated).toBe(true);
      expect(policy.label).toBe(TEST_LABEL);
      expect(policy.parameters).toHaveLength(2);
    });

    it('given empty id then throws', () => {
      expect(() => new Policy(createMockPolicyData({ id: '' }))).toThrow('Policy requires an id');
    });

    it('given null label then label is null', () => {
      // Given
      const data = createMockPolicyData({ label: null });

      // When
      const policy = new Policy(data);

      // Then
      expect(policy.label).toBeNull();
    });

    it('given parameters then creates a defensive copy', () => {
      // Given
      const data = createMockPolicyData();
      const originalParamCount = data.parameters.length;

      // When
      const policy = new Policy(data);
      data.parameters.push({
        parameterName: 'extra.param',
        value: 999,
        startDate: '2026-01-01',
        endDate: null,
      });

      // Then - mutating original data does not affect the policy
      expect(policy.parameters).toHaveLength(originalParamCount);
    });
  });

  // ========================================================================
  // label getter / setter
  // ========================================================================

  describe('label', () => {
    it('given label set via setter then getter returns new value', () => {
      // Given
      const policy = new Policy(createMockPolicyData());

      // When
      policy.label = 'Renamed policy';

      // Then
      expect(policy.label).toBe('Renamed policy');
    });

    it('given label set to null then getter returns null', () => {
      // Given
      const policy = new Policy(createMockPolicyData());

      // When
      policy.label = null;

      // Then
      expect(policy.label).toBeNull();
    });
  });

  // ========================================================================
  // parameters getter
  // ========================================================================

  describe('parameters', () => {
    it('given policy with parameters then returns readonly array', () => {
      // Given
      const data = createMockPolicyData();

      // When
      const policy = new Policy(data);
      const params = policy.parameters;

      // Then
      expect(params).toHaveLength(2);
      expect(params[0].parameterName).toBe(TEST_PARAMETER_NAMES.INCOME_TAX_RATE);
      expect(params[1].parameterName).toBe(TEST_PARAMETER_NAMES.STANDARD_DEDUCTION);
    });
  });

  // ========================================================================
  // parameterCount
  // ========================================================================

  describe('parameterCount', () => {
    it('given policy with two parameters then returns 2', () => {
      // Given
      const policy = new Policy(createMockPolicyData());

      // When
      const count = policy.parameterCount;

      // Then
      expect(count).toBe(2);
    });

    it('given policy with no parameters then returns 0', () => {
      // Given
      const policy = new Policy(createMockCurrentLawPolicyData());

      // When
      const count = policy.parameterCount;

      // Then
      expect(count).toBe(0);
    });
  });

  // ========================================================================
  // isCurrentLaw / isReform
  // ========================================================================

  describe('isCurrentLaw', () => {
    it('given policy with no parameters then returns true', () => {
      // Given
      const policy = new Policy(createMockCurrentLawPolicyData());

      // When / Then
      expect(policy.isCurrentLaw).toBe(true);
    });

    it('given policy with parameters then returns false', () => {
      // Given
      const policy = new Policy(createMockPolicyData());

      // When / Then
      expect(policy.isCurrentLaw).toBe(false);
    });
  });

  describe('isReform', () => {
    it('given policy with parameters then returns true', () => {
      // Given
      const policy = new Policy(createMockPolicyData());

      // When / Then
      expect(policy.isReform).toBe(true);
    });

    it('given policy with no parameters then returns false', () => {
      // Given
      const policy = new Policy(createMockCurrentLawPolicyData());

      // When / Then
      expect(policy.isReform).toBe(false);
    });

    it('given any policy then isReform is opposite of isCurrentLaw', () => {
      // Given
      const reform = new Policy(createMockPolicyData());
      const currentLaw = new Policy(createMockCurrentLawPolicyData());

      // When / Then
      expect(reform.isReform).toBe(!reform.isCurrentLaw);
      expect(currentLaw.isReform).toBe(!currentLaw.isCurrentLaw);
    });
  });

  // ========================================================================
  // parameterNames
  // ========================================================================

  describe('parameterNames', () => {
    it('given policy with distinct parameters then returns unique names', () => {
      // Given
      const policy = new Policy(createMockPolicyData());

      // When
      const names = policy.parameterNames;

      // Then
      expect(names).toEqual([
        TEST_PARAMETER_NAMES.INCOME_TAX_RATE,
        TEST_PARAMETER_NAMES.STANDARD_DEDUCTION,
      ]);
    });

    it('given policy with duplicate parameter names then returns deduplicated list', () => {
      // Given
      const data = createMockPolicyData({
        parameters: [
          {
            parameterName: TEST_PARAMETER_NAMES.INCOME_TAX_RATE,
            parameterId: 'p1',
            value: 0.2,
            startDate: '2026-01-01',
            endDate: '2026-06-30',
          },
          {
            parameterName: TEST_PARAMETER_NAMES.INCOME_TAX_RATE,
            parameterId: 'p2',
            value: 0.3,
            startDate: '2026-07-01',
            endDate: '2026-12-31',
          },
        ],
      });
      const policy = new Policy(data);

      // When
      const names = policy.parameterNames;

      // Then
      expect(names).toEqual([TEST_PARAMETER_NAMES.INCOME_TAX_RATE]);
      expect(names).toHaveLength(1);
    });

    it('given current law policy then returns empty array', () => {
      // Given
      const policy = new Policy(createMockCurrentLawPolicyData());

      // When
      const names = policy.parameterNames;

      // Then
      expect(names).toEqual([]);
    });
  });

  // ========================================================================
  // fromV2Response()
  // ========================================================================

  describe('fromV2Response', () => {
    it('given V2PolicyResponse then maps all fields correctly', () => {
      // Given
      const response = createMockV2PolicyResponse();

      // When
      const policy = Policy.fromV2Response(response);

      // Then
      expect(policy.id).toBe(TEST_POLICY_IDS.POLICY_A);
      expect(policy.countryId).toBe('us');
      expect(policy.label).toBe('Reform policy');
      expect(policy.apiVersion).toBe('v2');
      expect(policy.isCreated).toBe(true);
    });

    it('given V2PolicyResponse then maps parameter_values to parameters', () => {
      // Given
      const response = createMockV2PolicyResponse();

      // When
      const policy = Policy.fromV2Response(response);

      // Then
      expect(policy.parameterCount).toBe(2);
      const params = policy.parameters;
      expect(params[0].parameterName).toBe(TEST_PARAMETER_NAMES.INCOME_TAX_RATE);
      expect(params[0].parameterId).toBe('param-001');
      expect(params[0].value).toBe(0.25);
      expect(params[0].startDate).toBe('2026-01-01');
      expect(params[0].endDate).toBe('2026-12-31');
      expect(params[1].parameterName).toBe(TEST_PARAMETER_NAMES.STANDARD_DEDUCTION);
      expect(params[1].value).toBe(15000);
      expect(params[1].endDate).toBeNull();
    });

    it('given V2PolicyResponse with name then maps name to label', () => {
      // Given
      const response = createMockV2PolicyResponse({ name: 'Custom name' });

      // When
      const policy = Policy.fromV2Response(response);

      // Then
      expect(policy.label).toBe('Custom name');
    });

    it('given V2PolicyResponse with tax_benefit_model_id then casts to countryId', () => {
      // Given
      const response = createMockV2PolicyResponse({
        tax_benefit_model_id: 'uk',
      });

      // When
      const policy = Policy.fromV2Response(response);

      // Then
      expect(policy.countryId).toBe('uk');
    });

    it('given V2PolicyResponse with empty parameter_values then creates current law', () => {
      // Given
      const response = createMockV2PolicyResponseNoParams();

      // When
      const policy = Policy.fromV2Response(response);

      // Then
      expect(policy.isCurrentLaw).toBe(true);
      expect(policy.parameterCount).toBe(0);
    });

    it('given parameter_value with null parameter_name then falls back to parameter_id', () => {
      // Given
      const response = createMockV2PolicyResponse({
        parameter_values: [
          {
            id: 'pv-001',
            parameter_id: 'param-fallback-id',
            parameter_name: null as unknown as string,
            value_json: 42,
            start_date: '2026-01-01',
            end_date: null,
            policy_id: null,
            dynamic_id: null,
            created_at: '2026-01-01T00:00:00Z',
          },
        ],
      });

      // When
      const policy = Policy.fromV2Response(response);

      // Then
      expect(policy.parameters[0].parameterName).toBe('param-fallback-id');
    });

    it('given invalid tax_benefit_model_id then throws', () => {
      // Given
      const response = createMockV2PolicyResponse({
        tax_benefit_model_id: 'invalid-country',
      });

      // When / Then
      expect(() => Policy.fromV2Response(response)).toThrow('invalid-country');
    });

    it('given V2PolicyResponse with name null then label is null', () => {
      // Given
      const response = createMockV2PolicyResponse({ name: null as unknown as string });

      // When
      const policy = Policy.fromV2Response(response);

      // Then
      expect(policy.label).toBeNull();
    });
  });

  // ========================================================================
  // toJSON() roundtrip
  // ========================================================================

  describe('toJSON', () => {
    it('given policy created from data then toJSON deep equals original data', () => {
      // Given
      const data = createMockPolicyData();

      // When
      const policy = new Policy(data);
      const json = policy.toJSON();

      // Then
      expect(json).toEqual(data);
    });

    it('given policy with updated label then toJSON reflects the update', () => {
      // Given
      const data = createMockPolicyData();
      const policy = new Policy(data);

      // When
      policy.label = 'Updated label';
      const json = policy.toJSON();

      // Then
      expect(json.label).toBe('Updated label');
      expect(json.id).toBe(TEST_ID);
    });

    it('given current law policy then toJSON roundtrips correctly', () => {
      // Given
      const data = createMockCurrentLawPolicyData();

      // When
      const policy = new Policy(data);
      const json = policy.toJSON();

      // Then
      expect(json).toEqual(data);
      expect(json.parameters).toEqual([]);
    });
  });

  // ========================================================================
  // isEqual
  // ========================================================================

  describe('isEqual', () => {
    it('given same id, label, and parameter count then returns true', () => {
      // Given
      const dataA = createMockPolicyData();
      const dataB = createMockPolicyData();
      const policyA = new Policy(dataA);
      const policyB = new Policy(dataB);

      // When / Then
      expect(policyA.isEqual(policyB)).toBe(true);
    });

    it('given different label then returns false', () => {
      // Given
      const policyA = new Policy(createMockPolicyData());
      const policyB = new Policy(createMockPolicyData({ label: 'Different label' }));

      // When / Then
      expect(policyA.isEqual(policyB)).toBe(false);
    });

    it('given different id then returns false', () => {
      // Given
      const policyA = new Policy(createMockPolicyData());
      const policyB = new Policy(createMockPolicyData({ id: 'different-id-999' }));

      // When / Then
      expect(policyA.isEqual(policyB)).toBe(false);
    });

    it('given different parameter count then returns false', () => {
      // Given
      const policyA = new Policy(createMockPolicyData());
      const policyB = new Policy(
        createMockCurrentLawPolicyData({ id: TEST_ID, label: TEST_LABEL })
      );

      // When / Then
      expect(policyA.isEqual(policyB)).toBe(false);
    });

    it('given both current law with same id and null labels then returns true', () => {
      // Given
      const policyA = new Policy(createMockCurrentLawPolicyData());
      const policyB = new Policy(createMockCurrentLawPolicyData());

      // When / Then
      expect(policyA.isEqual(policyB)).toBe(true);
    });
  });
});
