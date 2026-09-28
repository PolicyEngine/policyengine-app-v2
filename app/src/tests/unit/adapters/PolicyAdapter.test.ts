import { describe, expect, it } from 'vitest';
import { PolicyAdapter } from '@/adapters/PolicyAdapter';
import {
  mockPolicy,
  mockPolicyMetadata,
  mockPolicyMetadataMultipleParams,
  TEST_COUNTRIES,
  TEST_PARAMETER_NAMES,
  TEST_POLICY_IDS,
} from '@/tests/fixtures/adapters/PolicyAdapterMocks';

describe('PolicyAdapter', () => {
  describe('fromMetadata', () => {
    it('given policy metadata then converts to Policy', () => {
      // Given
      const metadata = mockPolicyMetadata();

      // When
      const result = PolicyAdapter.fromMetadata(metadata);

      // Then
      expect(result).toEqual({
        id: TEST_POLICY_IDS.POLICY_1,
        countryId: TEST_COUNTRIES.US,
        apiVersion: '1.0.0',
        parameters: [
          {
            name: TEST_PARAMETER_NAMES.TAX_RATE,
            values: [
              { startDate: '2024-01-01', endDate: '2024-12-31', value: 0.25 },
              { startDate: '2025-01-01', endDate: '2025-12-31', value: 0.27 },
            ],
          },
        ],
      });
    });

    it('given metadata with multiple parameters then converts all', () => {
      // Given
      const metadata = mockPolicyMetadataMultipleParams();

      // When
      const result = PolicyAdapter.fromMetadata(metadata);

      // Then
      expect(result.parameters).toHaveLength(2);
      expect(result.parameters?.[0].name).toBe(TEST_PARAMETER_NAMES.TAX_RATE);
      expect(result.parameters?.[1].name).toBe(TEST_PARAMETER_NAMES.BENEFIT_AMOUNT);
      expect(result.parameters?.[1].values).toHaveLength(2);
    });

    it('given empty policy_json then converts to empty parameters', () => {
      // Given
      const metadata = mockPolicyMetadata({ policy_json: {} });

      // When
      const result = PolicyAdapter.fromMetadata(metadata);

      // Then
      expect(result.parameters).toEqual([]);
    });

    it('given UK policy then uses correct country', () => {
      // Given
      const metadata = mockPolicyMetadata({ country_id: TEST_COUNTRIES.UK });

      // When
      const result = PolicyAdapter.fromMetadata(metadata);

      // Then
      expect(result.countryId).toBe(TEST_COUNTRIES.UK);
    });

    it('given legacy string values then casts them to typed policy values', () => {
      // Given
      const metadata = mockPolicyMetadata({
        policy_json: {
          numeric_parameter: { '2024-01-01.2024-12-31': '3000' },
          boolean_parameter: { '2024-01-01.2024-12-31': 'false' },
        },
      });

      // When
      const result = PolicyAdapter.fromMetadata(metadata);

      // Then
      expect(result.parameters).toEqual([
        {
          name: 'numeric_parameter',
          values: [{ startDate: '2024-01-01', endDate: '2024-12-31', value: 3000 }],
        },
        {
          name: 'boolean_parameter',
          values: [{ startDate: '2024-01-01', endDate: '2024-12-31', value: false }],
        },
      ]);
    });

    it('given a non-finite stored value then rejects the policy', () => {
      // Given
      const metadata = mockPolicyMetadata({
        policy_json: {
          numeric_parameter: { '2024-01-01.2024-12-31': Number.POSITIVE_INFINITY },
        },
      });

      // When / Then
      expect(() => PolicyAdapter.fromMetadata(metadata)).toThrow(
        'Policy parameter values must be finite: Infinity'
      );
    });
  });

  describe('toCreationPayload', () => {
    it('given policy with parameters then creates payload', () => {
      // Given
      const policy = mockPolicy();

      // When
      const payload = PolicyAdapter.toCreationPayload(policy);

      // Then
      expect(payload).toEqual({
        data: {
          tax_rate: {
            '2024-01-01.2024-12-31': 0.25,
            '2025-01-01.2025-12-31': 0.27,
          },
        },
      });
    });

    it('given policy with no parameters then creates empty payload', () => {
      // Given
      const policy = mockPolicy({ parameters: [] });

      // When
      const payload = PolicyAdapter.toCreationPayload(policy);

      // Then
      expect(payload).toEqual({
        data: {},
      });
    });

    it('given policy with undefined parameters then creates empty payload', () => {
      // Given
      const policy = mockPolicy({ parameters: undefined });

      // When
      const payload = PolicyAdapter.toCreationPayload(policy);

      // Then
      expect(payload).toEqual({
        data: {},
      });
    });

    it('given a legacy string in runtime state then casts it before serialization', () => {
      // Given
      const policy = mockPolicy({
        parameters: [
          {
            name: 'tax_rate',
            values: [
              {
                startDate: '2024-01-01',
                endDate: '2024-12-31',
                value: '0.25' as unknown as number,
              },
            ],
          },
        ],
      });

      // When
      const payload = PolicyAdapter.toCreationPayload(policy);

      // Then
      expect(payload.data.tax_rate['2024-01-01.2024-12-31']).toBe(0.25);
    });

    it('given an invalid runtime value then refuses to serialize the policy', () => {
      // Given
      const policy = mockPolicy({
        parameters: [
          {
            name: 'tax_rate',
            values: [
              {
                startDate: '2024-01-01',
                endDate: '2024-12-31',
                value: Number.NaN,
              },
            ],
          },
        ],
      });

      // When / Then
      expect(() => PolicyAdapter.toCreationPayload(policy)).toThrow(
        'Policy parameter values must be finite: NaN'
      );
    });
  });
});
