import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import {
  clearLocalStorageData,
  getGeographiesForMigration,
  getHouseholdsForMigration,
  getPoliciesForMigration,
  getReportsForMigration,
  getSimulationsForMigration,
  migrateAllAssociations,
  MigrationAPI,
  needsMigration,
  OLD_MOCK_USER_ID,
  STORAGE_KEYS,
} from '@/libs/migrationService';
import { STORAGE_KEYS as USER_IDENTITY_KEYS } from '@/libs/userIdentity';

// Mock data that matches actual application types
const MOCK_HOUSEHOLD = {
  id: 'suh-abc123',
  type: 'household' as const,
  userId: OLD_MOCK_USER_ID,
  householdId: 'hh-123',
  countryId: 'us' as const,
  label: 'Test Household',
  createdAt: '2025-01-01T00:00:00.000Z',
  isCreated: true,
};

const MOCK_POLICY = {
  id: 'sup-def456',
  userId: OLD_MOCK_USER_ID,
  policyId: 'policy-123',
  countryId: 'us' as const,
  label: 'Test Policy',
  createdAt: '2025-01-01T00:00:00.000Z',
  isCreated: true,
};

const MOCK_SIMULATION = {
  id: 'sus-ghi789',
  userId: OLD_MOCK_USER_ID,
  simulationId: 'sim-123',
  countryId: 'us' as const,
  label: 'Test Simulation',
  createdAt: '2025-01-01T00:00:00.000Z',
  isCreated: true,
};

const MOCK_REPORT = {
  id: 'sur-jkl012',
  userId: OLD_MOCK_USER_ID,
  reportId: 'report-123',
  countryId: 'us' as const,
  label: 'Test Report',
  createdAt: '2025-01-01T00:00:00.000Z',
  isCreated: true,
};

const MOCK_GEOGRAPHY = {
  id: 'geo-mno345',
  type: 'geography' as const,
  userId: OLD_MOCK_USER_ID,
  geographyId: 'us',
  countryId: 'us' as const,
  scope: 'national' as const,
  label: 'United States',
  createdAt: '2025-01-01T00:00:00.000Z',
};

const NEW_USER_ID = 'new-user-uuid-1234-5678-90ab-cdef12345678' as `${string}-${string}-${string}-${string}-${string}`;

describe('migrationService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(NEW_USER_ID);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('needsMigration', () => {
    test('given no localStorage data and no migration flag then returns false', () => {
      // When
      const result = needsMigration();

      // Then
      expect(result).toBe(false);
    });

    test('given migration already complete then returns false', () => {
      // Given
      localStorage.setItem(USER_IDENTITY_KEYS.MIGRATION_COMPLETE, 'true');
      localStorage.setItem(STORAGE_KEYS.HOUSEHOLDS, JSON.stringify([MOCK_HOUSEHOLD]));

      // When
      const result = needsMigration();

      // Then
      expect(result).toBe(false);
    });

    test('given household data exists and migration not complete then returns true', () => {
      // Given
      localStorage.setItem(STORAGE_KEYS.HOUSEHOLDS, JSON.stringify([MOCK_HOUSEHOLD]));

      // When
      const result = needsMigration();

      // Then
      expect(result).toBe(true);
    });

    test('given policy data exists then returns true', () => {
      // Given
      localStorage.setItem(STORAGE_KEYS.POLICIES, JSON.stringify([MOCK_POLICY]));

      // When
      const result = needsMigration();

      // Then
      expect(result).toBe(true);
    });

    test('given simulation data exists then returns true', () => {
      // Given
      localStorage.setItem(STORAGE_KEYS.SIMULATIONS, JSON.stringify([MOCK_SIMULATION]));

      // When
      const result = needsMigration();

      // Then
      expect(result).toBe(true);
    });

    test('given report data exists then returns true', () => {
      // Given
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify([MOCK_REPORT]));

      // When
      const result = needsMigration();

      // Then
      expect(result).toBe(true);
    });

    test('given geography data exists then returns true', () => {
      // Given
      localStorage.setItem(STORAGE_KEYS.GEOGRAPHIES, JSON.stringify([MOCK_GEOGRAPHY]));

      // When
      const result = needsMigration();

      // Then
      expect(result).toBe(true);
    });

    test('given empty arrays in localStorage then returns false', () => {
      // Given
      localStorage.setItem(STORAGE_KEYS.HOUSEHOLDS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.POLICIES, JSON.stringify([]));

      // When
      const result = needsMigration();

      // Then
      expect(result).toBe(false);
    });

    test('given invalid JSON in localStorage then returns false for that key', () => {
      // Given
      localStorage.setItem(STORAGE_KEYS.HOUSEHOLDS, 'invalid json');

      // When
      const result = needsMigration();

      // Then
      expect(result).toBe(false);
    });
  });

  describe('getHouseholdsForMigration', () => {
    test('given no households then returns empty array', () => {
      // When
      const result = getHouseholdsForMigration(NEW_USER_ID);

      // Then
      expect(result).toEqual([]);
    });

    test('given households with old user ID then updates user ID', () => {
      // Given
      localStorage.setItem(STORAGE_KEYS.HOUSEHOLDS, JSON.stringify([MOCK_HOUSEHOLD]));

      // When
      const result = getHouseholdsForMigration(NEW_USER_ID);

      // Then
      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe(NEW_USER_ID);
      expect(result[0].householdId).toBe(MOCK_HOUSEHOLD.householdId);
    });

    test('given household with different user ID then preserves original', () => {
      // Given
      const householdWithDifferentUser = { ...MOCK_HOUSEHOLD, userId: 'other-user' };
      localStorage.setItem(STORAGE_KEYS.HOUSEHOLDS, JSON.stringify([householdWithDifferentUser]));

      // When
      const result = getHouseholdsForMigration(NEW_USER_ID);

      // Then
      expect(result[0].userId).toBe('other-user');
    });

    test('given multiple households then updates all with old user ID', () => {
      // Given
      const households = [
        MOCK_HOUSEHOLD,
        { ...MOCK_HOUSEHOLD, id: 'suh-2', householdId: 'hh-456', userId: OLD_MOCK_USER_ID },
        { ...MOCK_HOUSEHOLD, id: 'suh-3', householdId: 'hh-789', userId: 'other-user' },
      ];
      localStorage.setItem(STORAGE_KEYS.HOUSEHOLDS, JSON.stringify(households));

      // When
      const result = getHouseholdsForMigration(NEW_USER_ID);

      // Then
      expect(result).toHaveLength(3);
      expect(result[0].userId).toBe(NEW_USER_ID);
      expect(result[1].userId).toBe(NEW_USER_ID);
      expect(result[2].userId).toBe('other-user'); // Not updated
    });
  });

  describe('getPoliciesForMigration', () => {
    test('given no policies then returns empty array', () => {
      // When
      const result = getPoliciesForMigration(NEW_USER_ID);

      // Then
      expect(result).toEqual([]);
    });

    test('given policies with old user ID then updates user ID', () => {
      // Given
      localStorage.setItem(STORAGE_KEYS.POLICIES, JSON.stringify([MOCK_POLICY]));

      // When
      const result = getPoliciesForMigration(NEW_USER_ID);

      // Then
      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe(NEW_USER_ID);
    });
  });

  describe('getSimulationsForMigration', () => {
    test('given no simulations then returns empty array', () => {
      // When
      const result = getSimulationsForMigration(NEW_USER_ID);

      // Then
      expect(result).toEqual([]);
    });

    test('given simulations with old user ID then updates user ID', () => {
      // Given
      localStorage.setItem(STORAGE_KEYS.SIMULATIONS, JSON.stringify([MOCK_SIMULATION]));

      // When
      const result = getSimulationsForMigration(NEW_USER_ID);

      // Then
      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe(NEW_USER_ID);
    });
  });

  describe('getReportsForMigration', () => {
    test('given no reports then returns empty array', () => {
      // When
      const result = getReportsForMigration(NEW_USER_ID);

      // Then
      expect(result).toEqual([]);
    });

    test('given reports with old user ID then updates user ID', () => {
      // Given
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify([MOCK_REPORT]));

      // When
      const result = getReportsForMigration(NEW_USER_ID);

      // Then
      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe(NEW_USER_ID);
    });
  });

  describe('getGeographiesForMigration', () => {
    test('given no geographies then returns empty array', () => {
      // When
      const result = getGeographiesForMigration(NEW_USER_ID);

      // Then
      expect(result).toEqual([]);
    });

    test('given geographies with old user ID then updates user ID', () => {
      // Given
      localStorage.setItem(STORAGE_KEYS.GEOGRAPHIES, JSON.stringify([MOCK_GEOGRAPHY]));

      // When
      const result = getGeographiesForMigration(NEW_USER_ID);

      // Then
      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe(NEW_USER_ID);
    });
  });

  describe('clearLocalStorageData', () => {
    test('given data in all storage keys then clears all', () => {
      // Given
      localStorage.setItem(STORAGE_KEYS.HOUSEHOLDS, JSON.stringify([MOCK_HOUSEHOLD]));
      localStorage.setItem(STORAGE_KEYS.POLICIES, JSON.stringify([MOCK_POLICY]));
      localStorage.setItem(STORAGE_KEYS.SIMULATIONS, JSON.stringify([MOCK_SIMULATION]));
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify([MOCK_REPORT]));
      localStorage.setItem(STORAGE_KEYS.GEOGRAPHIES, JSON.stringify([MOCK_GEOGRAPHY]));

      // When
      clearLocalStorageData();

      // Then
      expect(localStorage.getItem(STORAGE_KEYS.HOUSEHOLDS)).toBeNull();
      expect(localStorage.getItem(STORAGE_KEYS.POLICIES)).toBeNull();
      expect(localStorage.getItem(STORAGE_KEYS.SIMULATIONS)).toBeNull();
      expect(localStorage.getItem(STORAGE_KEYS.REPORTS)).toBeNull();
      expect(localStorage.getItem(STORAGE_KEYS.GEOGRAPHIES)).toBeNull();
    });

    test('given other localStorage keys then preserves them', () => {
      // Given
      localStorage.setItem(STORAGE_KEYS.HOUSEHOLDS, JSON.stringify([MOCK_HOUSEHOLD]));
      localStorage.setItem('other-key', 'other-value');
      localStorage.setItem(USER_IDENTITY_KEYS.USER_ID, NEW_USER_ID);

      // When
      clearLocalStorageData();

      // Then
      expect(localStorage.getItem('other-key')).toBe('other-value');
      expect(localStorage.getItem(USER_IDENTITY_KEYS.USER_ID)).toBe(NEW_USER_ID);
    });
  });

  describe('migrateAllAssociations', () => {
    const createMockAPI = (): MigrationAPI => ({
      createHousehold: vi.fn().mockResolvedValue(undefined),
      createPolicy: vi.fn().mockResolvedValue(undefined),
      createSimulation: vi.fn().mockResolvedValue(undefined),
      createReport: vi.fn().mockResolvedValue(undefined),
      createGeography: vi.fn().mockResolvedValue(undefined),
    });

    test('given no data to migrate then returns success with zero counts', async () => {
      // Given
      const api = createMockAPI();

      // When
      const report = await migrateAllAssociations(api);

      // Then
      expect(report.success).toBe(true);
      expect(report.newUserId).toBe(NEW_USER_ID);
      expect(report.results).toHaveLength(5);
      expect(report.results.every((r) => r.totalRecords === 0)).toBe(true);
      expect(report.results.every((r) => r.migratedCount === 0)).toBe(true);
    });

    test('given data to migrate then calls API for each record', async () => {
      // Given
      localStorage.setItem(STORAGE_KEYS.HOUSEHOLDS, JSON.stringify([MOCK_HOUSEHOLD]));
      localStorage.setItem(STORAGE_KEYS.POLICIES, JSON.stringify([MOCK_POLICY]));
      const api = createMockAPI();

      // When
      await migrateAllAssociations(api);

      // Then
      expect(api.createHousehold).toHaveBeenCalledTimes(1);
      expect(api.createPolicy).toHaveBeenCalledTimes(1);
      expect(api.createSimulation).not.toHaveBeenCalled();
    });

    test('given successful migration then clears localStorage and marks complete', async () => {
      // Given
      localStorage.setItem(STORAGE_KEYS.HOUSEHOLDS, JSON.stringify([MOCK_HOUSEHOLD]));
      const api = createMockAPI();

      // When
      await migrateAllAssociations(api);

      // Then
      expect(localStorage.getItem(STORAGE_KEYS.HOUSEHOLDS)).toBeNull();
      expect(localStorage.getItem(USER_IDENTITY_KEYS.MIGRATION_COMPLETE)).toBe('true');
    });

    test('given API returns duplicate error then skips without failing', async () => {
      // Given
      localStorage.setItem(STORAGE_KEYS.HOUSEHOLDS, JSON.stringify([MOCK_HOUSEHOLD]));
      const api = createMockAPI();
      (api.createHousehold as any).mockRejectedValue(new Error('Record already exists'));

      // When
      const report = await migrateAllAssociations(api);

      // Then
      expect(report.success).toBe(true);
      expect(report.results[0].skippedCount).toBe(1);
      expect(report.results[0].errorCount).toBe(0);
    });

    test('given API returns duplicate error with alternate message then skips', async () => {
      // Given
      localStorage.setItem(STORAGE_KEYS.HOUSEHOLDS, JSON.stringify([MOCK_HOUSEHOLD]));
      const api = createMockAPI();
      (api.createHousehold as any).mockRejectedValue(new Error('duplicate key violation'));

      // When
      const report = await migrateAllAssociations(api);

      // Then
      expect(report.success).toBe(true);
      expect(report.results[0].skippedCount).toBe(1);
    });

    test('given API returns non-duplicate error then records error', async () => {
      // Given
      localStorage.setItem(STORAGE_KEYS.HOUSEHOLDS, JSON.stringify([MOCK_HOUSEHOLD]));
      const api = createMockAPI();
      (api.createHousehold as any).mockRejectedValue(new Error('Network error'));

      // When
      const report = await migrateAllAssociations(api);

      // Then
      expect(report.success).toBe(false);
      expect(report.results[0].errorCount).toBe(1);
      expect(report.results[0].errors).toContain('Network error');
    });

    test('given errors then does not clear localStorage or mark complete', async () => {
      // Given
      localStorage.setItem(STORAGE_KEYS.HOUSEHOLDS, JSON.stringify([MOCK_HOUSEHOLD]));
      const api = createMockAPI();
      (api.createHousehold as any).mockRejectedValue(new Error('Network error'));

      // When
      await migrateAllAssociations(api);

      // Then
      expect(localStorage.getItem(STORAGE_KEYS.HOUSEHOLDS)).not.toBeNull();
      expect(localStorage.getItem(USER_IDENTITY_KEYS.MIGRATION_COMPLETE)).toBeNull();
    });

    test('given multiple records of same type then migrates all', async () => {
      // Given
      const households = [
        MOCK_HOUSEHOLD,
        { ...MOCK_HOUSEHOLD, id: 'suh-2', householdId: 'hh-456' },
        { ...MOCK_HOUSEHOLD, id: 'suh-3', householdId: 'hh-789' },
      ];
      localStorage.setItem(STORAGE_KEYS.HOUSEHOLDS, JSON.stringify(households));
      const api = createMockAPI();

      // When
      const report = await migrateAllAssociations(api);

      // Then
      expect(api.createHousehold).toHaveBeenCalledTimes(3);
      expect(report.results[0].totalRecords).toBe(3);
      expect(report.results[0].migratedCount).toBe(3);
    });

    test('given data in all types then migrates all types', async () => {
      // Given
      localStorage.setItem(STORAGE_KEYS.HOUSEHOLDS, JSON.stringify([MOCK_HOUSEHOLD]));
      localStorage.setItem(STORAGE_KEYS.POLICIES, JSON.stringify([MOCK_POLICY]));
      localStorage.setItem(STORAGE_KEYS.SIMULATIONS, JSON.stringify([MOCK_SIMULATION]));
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify([MOCK_REPORT]));
      localStorage.setItem(STORAGE_KEYS.GEOGRAPHIES, JSON.stringify([MOCK_GEOGRAPHY]));
      const api = createMockAPI();

      // When
      const report = await migrateAllAssociations(api);

      // Then
      expect(report.success).toBe(true);
      expect(api.createHousehold).toHaveBeenCalledTimes(1);
      expect(api.createPolicy).toHaveBeenCalledTimes(1);
      expect(api.createSimulation).toHaveBeenCalledTimes(1);
      expect(api.createReport).toHaveBeenCalledTimes(1);
      expect(api.createGeography).toHaveBeenCalledTimes(1);
      expect(report.results.every((r) => r.migratedCount === 1)).toBe(true);
    });

    test('given migration then report contains timing information', async () => {
      // Given
      const api = createMockAPI();

      // When
      const report = await migrateAllAssociations(api);

      // Then
      expect(report.startTime).toBeDefined();
      expect(report.endTime).toBeDefined();
      expect(new Date(report.startTime).getTime()).toBeLessThanOrEqual(
        new Date(report.endTime).getTime()
      );
    });
  });

  describe('STORAGE_KEYS', () => {
    test('given STORAGE_KEYS then contains expected localStorage key names', () => {
      // Then
      expect(STORAGE_KEYS.HOUSEHOLDS).toBe('user-population-households');
      expect(STORAGE_KEYS.POLICIES).toBe('user-policy-associations');
      expect(STORAGE_KEYS.SIMULATIONS).toBe('user-simulation-associations');
      expect(STORAGE_KEYS.REPORTS).toBe('user-report-associations');
      expect(STORAGE_KEYS.GEOGRAPHIES).toBe('user-geographic-associations');
    });
  });

  describe('OLD_MOCK_USER_ID', () => {
    test('given OLD_MOCK_USER_ID then equals expected value', () => {
      // Then
      expect(OLD_MOCK_USER_ID).toBe('anonymous');
    });
  });
});
