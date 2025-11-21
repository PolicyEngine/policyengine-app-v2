import { describe, expect, test } from 'vitest';
import {
  EXPECTED_REPORT_STATE_STRUCTURE,
  TEST_COUNTRIES,
} from '@/tests/fixtures/utils/pathwayState/initializeStateMocks';
import { initializeReportState } from '@/utils/pathwayState/initializeReportState';

describe('initializeReportState', () => {
  describe('Basic structure', () => {
    test('given country ID then returns report state with correct structure', () => {
      // When
      const result = initializeReportState(TEST_COUNTRIES.US);

      // Then
      expect(result).toMatchObject(EXPECTED_REPORT_STATE_STRUCTURE);
      expect(result.countryId).toBe(TEST_COUNTRIES.US);
    });

    test('given country ID then initializes with two simulations', () => {
      // When
      const result = initializeReportState(TEST_COUNTRIES.US);

      // Then
      expect(result.simulations).toHaveLength(2);
      expect(result.simulations[0]).toBeDefined();
      expect(result.simulations[1]).toBeDefined();
    });
  });

  describe('Default values', () => {
    test('given initialization then id is undefined', () => {
      // When
      const result = initializeReportState(TEST_COUNTRIES.US);

      // Then
      expect(result.id).toBeUndefined();
    });

    test('given initialization then label is null', () => {
      // When
      const result = initializeReportState(TEST_COUNTRIES.US);

      // Then
      expect(result.label).toBeNull();
    });

    test('given initialization then apiVersion is null', () => {
      // When
      const result = initializeReportState(TEST_COUNTRIES.US);

      // Then
      expect(result.apiVersion).toBeNull();
    });

    test('given initialization then status is pending', () => {
      // When
      const result = initializeReportState(TEST_COUNTRIES.US);

      // Then
      expect(result.status).toBe('pending');
    });

    test('given initialization then outputType is undefined', () => {
      // When
      const result = initializeReportState(TEST_COUNTRIES.US);

      // Then
      expect(result.outputType).toBeUndefined();
    });

    test('given initialization then output is null', () => {
      // When
      const result = initializeReportState(TEST_COUNTRIES.US);

      // Then
      expect(result.output).toBeNull();
    });
  });

  describe('Country ID handling', () => {
    test('given US country ID then sets correct country', () => {
      // When
      const result = initializeReportState(TEST_COUNTRIES.US);

      // Then
      expect(result.countryId).toBe(TEST_COUNTRIES.US);
    });

    test('given UK country ID then sets correct country', () => {
      // When
      const result = initializeReportState(TEST_COUNTRIES.UK);

      // Then
      expect(result.countryId).toBe(TEST_COUNTRIES.UK);
    });

    test('given CA country ID then sets correct country', () => {
      // When
      const result = initializeReportState(TEST_COUNTRIES.CA);

      // Then
      expect(result.countryId).toBe(TEST_COUNTRIES.CA);
    });
  });

  describe('Nested simulation state', () => {
    test('given initialization then simulations have empty policy state', () => {
      // When
      const result = initializeReportState(TEST_COUNTRIES.US);

      // Then
      expect(result.simulations[0].policy).toBeDefined();
      expect(result.simulations[0].policy.id).toBeUndefined();
      expect(result.simulations[0].policy.label).toBeNull();
      expect(result.simulations[0].policy.parameters).toEqual([]);
    });

    test('given initialization then simulations have empty population state', () => {
      // When
      const result = initializeReportState(TEST_COUNTRIES.US);

      // Then
      expect(result.simulations[0].population).toBeDefined();
      expect(result.simulations[0].population.label).toBeNull();
      expect(result.simulations[0].population.type).toBeNull();
      expect(result.simulations[0].population.household).toBeNull();
      expect(result.simulations[0].population.geography).toBeNull();
    });

    test('given initialization then both simulations are independent objects', () => {
      // When
      const result = initializeReportState(TEST_COUNTRIES.US);

      // Then - Simulations should be different object references
      expect(result.simulations[0]).not.toBe(result.simulations[1]);
      expect(result.simulations[0].policy).not.toBe(result.simulations[1].policy);
      expect(result.simulations[0].population).not.toBe(result.simulations[1].population);
    });
  });

  describe('Immutability', () => {
    test('given multiple initializations then returns new objects each time', () => {
      // When
      const result1 = initializeReportState(TEST_COUNTRIES.US);
      const result2 = initializeReportState(TEST_COUNTRIES.US);

      // Then
      expect(result1).not.toBe(result2);
      expect(result1.simulations).not.toBe(result2.simulations);
    });
  });
});
