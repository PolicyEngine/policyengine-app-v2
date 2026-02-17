import { describe, expect, test } from 'vitest';
import { countPolicyModifications } from '@/utils/countParameterChanges';

describe('countPolicyModifications', () => {
  test('given undefined policy then returns 0', () => {
    expect(countPolicyModifications(undefined)).toBe(0);
  });

  test('given null policy then returns 0', () => {
    expect(countPolicyModifications(null)).toBe(0);
  });

  test('given policy with no parameters then returns 0', () => {
    expect(countPolicyModifications({ parameters: undefined })).toBe(0);
  });

  test('given policy with empty parameters then returns 0', () => {
    expect(countPolicyModifications({ parameters: [] })).toBe(0);
  });

  test('given policy with one parameter and one value interval then returns 1', () => {
    const policy = {
      parameters: [
        {
          name: 'tax_rate',
          values: [{ startDate: '2024-01-01', endDate: '2024-12-31', value: 0.25 }],
        },
      ],
    };
    expect(countPolicyModifications(policy)).toBe(1);
  });

  test('given policy with one parameter and multiple value intervals then returns count', () => {
    const policy = {
      parameters: [
        {
          name: 'tax_rate',
          values: [
            { startDate: '2024-01-01', endDate: '2024-12-31', value: 0.25 },
            { startDate: '2025-01-01', endDate: '2025-12-31', value: 0.27 },
            { startDate: '2026-01-01', endDate: '2026-12-31', value: 0.3 },
          ],
        },
      ],
    };
    expect(countPolicyModifications(policy)).toBe(3);
  });

  test('given policy with multiple parameters then returns sum of all value intervals', () => {
    const policy = {
      parameters: [
        {
          name: 'tax_rate',
          values: [
            { startDate: '2024-01-01', endDate: '2024-12-31', value: 0.25 },
            { startDate: '2025-01-01', endDate: '2025-12-31', value: 0.27 },
          ],
        },
        {
          name: 'benefit_amount',
          values: [{ startDate: '2024-01-01', endDate: '2024-12-31', value: 1000 }],
        },
      ],
    };
    expect(countPolicyModifications(policy)).toBe(3);
  });
});
