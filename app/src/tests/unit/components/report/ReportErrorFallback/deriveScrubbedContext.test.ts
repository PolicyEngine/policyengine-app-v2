import { describe, expect, test } from 'vitest';
import { deriveScrubbedContext } from '@/components/report/ReportErrorFallback/deriveScrubbedContext';
import type { ReportErrorContext } from '@/components/report/ReportErrorFallback/types';

describe('deriveScrubbedContext', () => {
  test('given undefined context then returns null', () => {
    // Given/When
    const result = deriveScrubbedContext(undefined);

    // Then
    expect(result).toBeNull();
  });

  test('given context with userReport then scrubs userId', () => {
    // Given
    const context: ReportErrorContext = {
      userReport: {
        id: 'sur-123',
        userId: 'secret-user-id',
        reportId: '456',
        countryId: 'us',
        label: 'Test Report',
        createdAt: '2025-01-01T00:00:00Z',
      },
    };

    // When
    const result = deriveScrubbedContext(context);

    // Then
    expect(result).not.toBeNull();
    expect(result!.userReport?.userId).toBe('[scrubbed]');
    expect(result!.userReport?.id).toBe('sur-123');
    expect(result!.userReport?.reportId).toBe('456');
  });

  test('given context with userSimulations array then scrubs all userIds', () => {
    // Given
    const context: ReportErrorContext = {
      userSimulations: [
        {
          id: 'sus-1',
          userId: 'user-1',
          simulationId: '101',
          countryId: 'us',
          label: 'Sim 1',
        },
        {
          id: 'sus-2',
          userId: 'user-2',
          simulationId: '102',
          countryId: 'us',
          label: 'Sim 2',
        },
      ],
    };

    // When
    const result = deriveScrubbedContext(context);

    // Then
    expect(result!.userSimulations).toHaveLength(2);
    expect(result!.userSimulations![0].userId).toBe('[scrubbed]');
    expect(result!.userSimulations![1].userId).toBe('[scrubbed]');
    expect(result!.userSimulations![0].id).toBe('sus-1');
    expect(result!.userSimulations![1].id).toBe('sus-2');
  });

  test('given context with userPolicies then scrubs userIds', () => {
    // Given
    const context: ReportErrorContext = {
      userPolicies: [
        {
          id: 'sup-1',
          userId: 'secret-user',
          policyId: '789',
          countryId: 'us',
          label: 'Policy 1',
        },
      ],
    };

    // When
    const result = deriveScrubbedContext(context);

    // Then
    expect(result!.userPolicies![0].userId).toBe('[scrubbed]');
    expect(result!.userPolicies![0].policyId).toBe('789');
  });

  test('given context with base ingredients then preserves them unchanged', () => {
    // Given
    const context: ReportErrorContext = {
      report: {
        id: '456',
        countryId: 'us',
        year: '2025',
        apiVersion: '1.0',
        simulationIds: ['101'],
        status: 'complete',
      },
      simulations: [
        {
          id: '101',
          countryId: 'us',
          label: 'Test Sim',
          isCreated: true,
        },
      ],
      policies: [
        {
          id: '789',
          countryId: 'us',
          label: 'Test Policy',
        },
      ],
    };

    // When
    const result = deriveScrubbedContext(context);

    // Then
    expect(result!.report).toEqual(context.report);
    expect(result!.simulations).toEqual(context.simulations);
    expect(result!.policies).toEqual(context.policies);
  });

  test('given context with null user associations then returns null for those fields', () => {
    // Given
    const context: ReportErrorContext = {
      userReport: null,
      userSimulations: null,
      userPolicies: null,
    };

    // When
    const result = deriveScrubbedContext(context);

    // Then
    expect(result!.userReport).toBeNull();
    expect(result!.userSimulations).toBeNull();
    expect(result!.userPolicies).toBeNull();
  });

  test('given full context then scrubs all user associations and preserves base ingredients', () => {
    // Given
    const context: ReportErrorContext = {
      userReport: {
        id: 'sur-123',
        userId: 'user-abc',
        reportId: '456',
        countryId: 'us',
        label: 'Report',
        createdAt: '2025-01-01T00:00:00Z',
      },
      userSimulations: [
        { id: 'sus-1', userId: 'user-abc', simulationId: '101', countryId: 'us', label: 'Sim' },
      ],
      userPolicies: [
        { id: 'sup-1', userId: 'user-abc', policyId: '789', countryId: 'us', label: 'Policy' },
      ],
      userHouseholds: null,
      userGeographies: null,
      report: {
        id: '456',
        countryId: 'us',
        year: '2025',
        apiVersion: '1.0',
        simulationIds: ['101'],
        status: 'complete',
      },
      simulations: [{ id: '101', countryId: 'us', label: 'Sim', isCreated: true }],
      policies: [{ id: '789', countryId: 'us', label: 'Policy' }],
      households: null,
      geographies: null,
    };

    // When
    const result = deriveScrubbedContext(context);

    // Then
    expect(result!.userReport?.userId).toBe('[scrubbed]');
    expect(result!.userSimulations![0].userId).toBe('[scrubbed]');
    expect(result!.userPolicies![0].userId).toBe('[scrubbed]');
    expect(result!.report?.id).toBe('456');
    expect(result!.simulations![0].id).toBe('101');
    expect(result!.policies![0].id).toBe('789');
  });
});
