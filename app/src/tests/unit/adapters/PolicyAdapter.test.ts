import { describe, expect, it } from 'vitest';
import { PolicyAdapter } from '@/adapters/PolicyAdapter';
import { V2PolicyResponse } from '@/api/policy';
import { mockPolicy, TEST_PARAMETER_NAMES } from '@/tests/fixtures/adapters/PolicyAdapterMocks';

describe('PolicyAdapter', () => {
  describe('fromV2Response', () => {
    it('given v2 response then converts to Policy', () => {
      // Given
      const response: V2PolicyResponse = {
        id: 'policy-uuid-123',
        name: 'Test policy',
        description: 'A test policy',
        tax_benefit_model_id: 'model-uuid-456',
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
      };

      // When
      const result = PolicyAdapter.fromV2Response(response);

      // Then
      expect(result.id).toBe('policy-uuid-123');
      expect(result.taxBenefitModelId).toBe('model-uuid-456');
      expect(result.parameters).toEqual([]);
    });

    it('given v2 response with null description then converts without error', () => {
      // Given
      const response: V2PolicyResponse = {
        id: 'policy-uuid-789',
        name: 'Unnamed policy',
        description: null,
        tax_benefit_model_id: 'model-uuid-456',
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
      };

      // When
      const result = PolicyAdapter.fromV2Response(response);

      // Then
      expect(result.id).toBe('policy-uuid-789');
      expect(result.parameters).toEqual([]);
    });
  });

  describe('toV2CreationPayload', () => {
    it('given policy with parameters then creates v2 payload', () => {
      // Given
      const policy = mockPolicy();
      const parametersMetadata = {
        [TEST_PARAMETER_NAMES.TAX_RATE]: {
          id: 'param-uuid-001',
          parameter: TEST_PARAMETER_NAMES.TAX_RATE,
        },
      };
      const taxBenefitModelId = 'model-uuid-456';

      // When
      const payload = PolicyAdapter.toV2CreationPayload(
        policy,
        parametersMetadata as any,
        taxBenefitModelId,
        'My policy'
      );

      // Then
      expect(payload.name).toBe('My policy');
      expect(payload.tax_benefit_model_id).toBe('model-uuid-456');
      expect(payload.parameter_values).toHaveLength(2);
      expect(payload.parameter_values[0]).toEqual({
        parameter_id: 'param-uuid-001',
        value_json: 0.25,
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-12-31T00:00:00Z',
      });
    });

    it('given no name then defaults to "Unnamed policy"', () => {
      // Given
      const policy = mockPolicy({ parameters: [] });

      // When
      const payload = PolicyAdapter.toV2CreationPayload(policy, {}, 'model-id');

      // Then
      expect(payload.name).toBe('Unnamed policy');
    });

    it('given policy with far-future end date then converts to null', () => {
      // Given
      const policy = mockPolicy({
        parameters: [
          {
            name: TEST_PARAMETER_NAMES.TAX_RATE,
            values: [{ startDate: '2025-01-01', endDate: '9999-12-31', value: 0.3 }],
          },
        ],
      });
      const parametersMetadata = {
        [TEST_PARAMETER_NAMES.TAX_RATE]: {
          id: 'param-uuid-001',
          parameter: TEST_PARAMETER_NAMES.TAX_RATE,
        },
      };

      // When
      const payload = PolicyAdapter.toV2CreationPayload(
        policy,
        parametersMetadata as any,
        'model-id'
      );

      // Then
      expect(payload.parameter_values[0].end_date).toBeNull();
    });

    it('given unknown parameter name then skips it', () => {
      // Given
      const policy = mockPolicy();
      const parametersMetadata = {}; // No matching metadata

      // When
      const payload = PolicyAdapter.toV2CreationPayload(policy, parametersMetadata, 'model-id');

      // Then
      expect(payload.parameter_values).toHaveLength(0);
    });
  });
});
