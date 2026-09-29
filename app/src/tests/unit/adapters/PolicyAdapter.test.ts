import { describe, expect, it } from 'vitest';
import { PolicyAdapter } from '@/adapters/PolicyAdapter';
import {
  mockParameterMetadata,
  mockPolicy,
  mockPolicyMetadata,
  mockPolicyMetadataMultipleParams,
  TEST_COUNTRIES,
  TEST_PARAMETER_NAMES,
  TEST_POLICY_IDS,
} from '@/tests/fixtures/adapters/PolicyAdapterMocks';

describe('PolicyAdapter', () => {
  const parameterMetadata = mockParameterMetadata();

  describe('fromMetadata', () => {
    it('given policy metadata then converts to Policy', () => {
      // Given
      const metadata = mockPolicyMetadata();

      // When
      const result = PolicyAdapter.fromMetadata(metadata, parameterMetadata);

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
      const result = PolicyAdapter.fromMetadata(metadata, parameterMetadata);

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
      const result = PolicyAdapter.fromMetadata(metadata, parameterMetadata);

      // Then
      expect(result.parameters).toEqual([]);
    });

    it('given UK policy then uses correct country', () => {
      // Given
      const metadata = mockPolicyMetadata({ country_id: TEST_COUNTRIES.UK });

      // When
      const result = PolicyAdapter.fromMetadata(metadata, parameterMetadata);

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
      const result = PolicyAdapter.fromMetadata(metadata, parameterMetadata);

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

    it('given JavaScript infinity then normalizes it to the JSON-safe marker', () => {
      // Given
      const metadata = mockPolicyMetadata({
        policy_json: {
          numeric_parameter: { '2024-01-01.2024-12-31': Number.POSITIVE_INFINITY },
        },
      });

      // When
      const result = PolicyAdapter.fromMetadata(metadata, parameterMetadata);

      // Then
      expect(result.parameters?.[0].values[0].value).toBe('Infinity');
    });

    it('given explicit positive and negative infinity markers then preserves them as numeric bounds', () => {
      // Given
      const metadata = mockPolicyMetadata({
        policy_json: {
          unbounded_numeric_parameter: {
            '2024-01-01.2024-12-31': 'inf',
            '2025-01-01.2025-12-31': '-inf',
          },
        },
      });

      // When
      const result = PolicyAdapter.fromMetadata(metadata, parameterMetadata);

      // Then
      expect(result.parameters?.[0].values).toEqual([
        { startDate: '2024-01-01', endDate: '2024-12-31', value: 'Infinity' },
        { startDate: '2025-01-01', endDate: '2025-12-31', value: '-Infinity' },
      ]);
    });

    it('given a variable-length list parameter then accepts a different valid list length', () => {
      // Given
      const metadata = mockPolicyMetadata({
        policy_json: {
          string_list_parameter: {
            '2024-01-01.2024-12-31': ['first', 'second'],
          },
        },
      });

      // When
      const result = PolicyAdapter.fromMetadata(metadata, parameterMetadata);

      // Then
      expect(result.parameters?.[0].values[0].value).toEqual(['first', 'second']);
    });

    it('given a list item with the wrong metadata type then rejects the policy', () => {
      // Given
      const metadata = mockPolicyMetadata({
        policy_json: {
          string_list_parameter: {
            '2024-01-01.2024-12-31': ['first', 2],
          },
        },
      });

      // When / Then
      expect(() => PolicyAdapter.fromMetadata(metadata, parameterMetadata)).toThrow(
        'Invalid string policy parameter string_list_parameter[1] value: 2'
      );
    });

    it('given an empty current-law list then uses its list unit to validate string items', () => {
      // Given
      const metadata = mockPolicyMetadata({
        policy_json: {
          empty_string_list_parameter: {
            '2024-01-01.2024-12-31': ['refundable_credit'],
          },
        },
      });

      // When
      const result = PolicyAdapter.fromMetadata(metadata, parameterMetadata);

      // Then
      expect(result.parameters?.[0].values[0].value).toEqual(['refundable_credit']);
    });

    it('given a numeric-looking string parameter then preserves it as text', () => {
      const metadata = mockPolicyMetadata({
        policy_json: {
          string_parameter: { '2024-01-01.2024-12-31': '00123' },
        },
      });

      const result = PolicyAdapter.fromMetadata(metadata, parameterMetadata);

      expect(result.parameters?.[0].values[0].value).toBe('00123');
    });

    it('given structured values then coerces each field from its metadata shape', () => {
      const metadata = mockPolicyMetadata({
        policy_json: {
          structured_parameter: {
            '2024-01-01.2024-12-31': {
              amount: '2.5',
              enabled: 'false',
              code: '00456',
              bands: ['3', 4],
            },
          },
        },
      });

      const result = PolicyAdapter.fromMetadata(metadata, parameterMetadata);

      expect(result.parameters?.[0].values[0].value).toEqual({
        amount: 2.5,
        enabled: false,
        code: '00456',
        bands: [3, 4],
      });
    });

    it('given a policy parameter absent from metadata then rejects it', () => {
      const metadata = mockPolicyMetadata({
        policy_json: {
          unknown_parameter: { '2024-01-01.2024-12-31': 1 },
        },
      });

      expect(() => PolicyAdapter.fromMetadata(metadata, parameterMetadata)).toThrow(
        'Missing parameter metadata for unknown_parameter'
      );
    });

    it('given parameter metadata without typed values then rejects the policy', () => {
      const metadata = mockPolicyMetadata({
        policy_json: {
          tax_rate: { '2024-01-01.2024-12-31': 0.25 },
        },
      });
      const incompleteParameterMetadata = {
        ...parameterMetadata,
        tax_rate: { ...parameterMetadata.tax_rate, values: undefined },
      };

      expect(() => PolicyAdapter.fromMetadata(metadata, incompleteParameterMetadata)).toThrow(
        'Parameter metadata for tax_rate has no typed values'
      );
    });
  });

  describe('toCreationPayload', () => {
    it('given policy with parameters then creates payload', () => {
      // Given
      const policy = mockPolicy();

      // When
      const payload = PolicyAdapter.toCreationPayload(policy, parameterMetadata);

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
      const payload = PolicyAdapter.toCreationPayload(policy, parameterMetadata);

      // Then
      expect(payload).toEqual({
        data: {},
      });
    });

    it('given policy with undefined parameters then creates empty payload', () => {
      // Given
      const policy = mockPolicy({ parameters: undefined });

      // When
      const payload = PolicyAdapter.toCreationPayload(policy, parameterMetadata);

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
      const payload = PolicyAdapter.toCreationPayload(policy, parameterMetadata);

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
      expect(() => PolicyAdapter.toCreationPayload(policy, parameterMetadata)).toThrow(
        'Policy parameter tax_rate values must be finite: NaN'
      );
    });

    it('given JavaScript infinity bounds then serializes JSON-safe infinity markers', () => {
      // Given
      const policy = mockPolicy({
        parameters: [
          {
            name: 'unbounded_numeric_parameter',
            values: [
              {
                startDate: '2024-01-01',
                endDate: '2024-12-31',
                value: Number.POSITIVE_INFINITY,
              },
              {
                startDate: '2025-01-01',
                endDate: '2025-12-31',
                value: Number.NEGATIVE_INFINITY,
              },
            ],
          },
        ],
      });

      // When
      const payload = PolicyAdapter.toCreationPayload(policy, parameterMetadata);

      // Then
      expect(payload.data.unbounded_numeric_parameter).toEqual({
        '2024-01-01.2024-12-31': 'Infinity',
        '2025-01-01.2025-12-31': '-Infinity',
      });
    });

    it('given malformed numeric input then refuses to serialize the policy', () => {
      const policy = mockPolicy({
        parameters: [
          {
            name: 'tax_rate',
            values: [
              {
                startDate: '2024-01-01',
                endDate: '2024-12-31',
                value: 'not-a-number',
              },
            ],
          },
        ],
      });

      expect(() => PolicyAdapter.toCreationPayload(policy, parameterMetadata)).toThrow(
        'Invalid numeric policy parameter tax_rate value: not-a-number'
      );
    });
  });
});
