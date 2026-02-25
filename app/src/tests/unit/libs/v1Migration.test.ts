import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  hasLocalStorageData,
  isMigrationComplete,
  LS_KEYS,
  MIGRATION_FLAG_KEY,
  migrateV1AssociationsToV2,
} from '@/libs/v1Migration';

// Mock all 4 v2 API modules
vi.mock('@/api/v2/userReportAssociations', () => ({
  createUserReportAssociationV2: vi.fn().mockResolvedValue({}),
  fetchUserReportAssociationsV2: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/api/v2/userSimulationAssociations', () => ({
  createUserSimulationAssociationV2: vi.fn().mockResolvedValue({}),
  fetchUserSimulationAssociationsV2: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/api/v2/userPolicyAssociations', () => ({
  createUserPolicyAssociationV2: vi.fn().mockResolvedValue({}),
  fetchUserPolicyAssociationsV2: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/api/v2/userHouseholdAssociations', () => ({
  createUserHouseholdAssociationV2: vi.fn().mockResolvedValue({}),
  fetchUserHouseholdAssociationsV2: vi.fn().mockResolvedValue([]),
}));

import {
  createUserReportAssociationV2,
  fetchUserReportAssociationsV2,
} from '@/api/v2/userReportAssociations';
import {
  createUserSimulationAssociationV2,
  fetchUserSimulationAssociationsV2,
} from '@/api/v2/userSimulationAssociations';
import {
  createUserPolicyAssociationV2,
  fetchUserPolicyAssociationsV2,
} from '@/api/v2/userPolicyAssociations';
import {
  createUserHouseholdAssociationV2,
  fetchUserHouseholdAssociationsV2,
} from '@/api/v2/userHouseholdAssociations';

const TEST_USER_ID = 'test-user-123';

const mockReport = {
  id: 'sur-abc123',
  userId: TEST_USER_ID,
  reportId: 'report-1',
  countryId: 'us',
  label: 'My report',
};

const mockSimulation = {
  id: 'sus-abc123',
  userId: TEST_USER_ID,
  simulationId: 'sim-1',
  countryId: 'us',
  label: 'My simulation',
};

const mockPolicy = {
  id: 'sup-abc123',
  userId: TEST_USER_ID,
  policyId: 'policy-1',
  countryId: 'us',
  label: 'My policy',
};

const mockHousehold = {
  id: 'suh-abc123',
  type: 'household',
  userId: TEST_USER_ID,
  householdId: 'household-1',
  countryId: 'us',
  label: 'My household',
};

describe('v1Migration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    // Reset fetch mocks to default (return empty arrays)
    vi.mocked(fetchUserReportAssociationsV2).mockResolvedValue([]);
    vi.mocked(fetchUserSimulationAssociationsV2).mockResolvedValue([]);
    vi.mocked(fetchUserPolicyAssociationsV2).mockResolvedValue([]);
    vi.mocked(fetchUserHouseholdAssociationsV2).mockResolvedValue([]);

    // Reset create mocks to default (return empty objects)
    vi.mocked(createUserReportAssociationV2).mockResolvedValue({} as any);
    vi.mocked(createUserSimulationAssociationV2).mockResolvedValue({} as any);
    vi.mocked(createUserPolicyAssociationV2).mockResolvedValue({} as any);
    vi.mocked(createUserHouseholdAssociationV2).mockResolvedValue({} as any);
  });

  describe('isMigrationComplete', () => {
    test('given no flag then returns false', () => {
      expect(isMigrationComplete()).toBe(false);
    });

    test('given flag is set then returns true', () => {
      localStorage.setItem(MIGRATION_FLAG_KEY, 'true');

      expect(isMigrationComplete()).toBe(true);
    });
  });

  describe('hasLocalStorageData', () => {
    test('given no localStorage data then returns false', () => {
      expect(hasLocalStorageData()).toBe(false);
    });

    test('given empty arrays in localStorage then returns false', () => {
      localStorage.setItem(LS_KEYS.reports, '[]');
      localStorage.setItem(LS_KEYS.simulations, '[]');

      expect(hasLocalStorageData()).toBe(false);
    });

    test('given report data in localStorage then returns true', () => {
      localStorage.setItem(LS_KEYS.reports, JSON.stringify([mockReport]));

      expect(hasLocalStorageData()).toBe(true);
    });

    test('given household data in localStorage then returns true', () => {
      localStorage.setItem(LS_KEYS.households, JSON.stringify([mockHousehold]));

      expect(hasLocalStorageData()).toBe(true);
    });

    test('given corrupted JSON then returns false', () => {
      localStorage.setItem(LS_KEYS.reports, 'not-valid-json');

      expect(hasLocalStorageData()).toBe(false);
    });
  });

  describe('migrateV1AssociationsToV2', () => {
    test('given no localStorage data then skips migration and returns true', async () => {
      const result = await migrateV1AssociationsToV2(TEST_USER_ID);

      expect(result).toBe(true);
      expect(createUserReportAssociationV2).not.toHaveBeenCalled();
      expect(createUserSimulationAssociationV2).not.toHaveBeenCalled();
      expect(createUserPolicyAssociationV2).not.toHaveBeenCalled();
      expect(createUserHouseholdAssociationV2).not.toHaveBeenCalled();
    });

    test('given no localStorage data then sets migration flag', async () => {
      await migrateV1AssociationsToV2(TEST_USER_ID);

      expect(localStorage.getItem(MIGRATION_FLAG_KEY)).toBe('true');
    });

    test('given localStorage reports then creates v2 associations', async () => {
      localStorage.setItem(LS_KEYS.reports, JSON.stringify([mockReport]));

      await migrateV1AssociationsToV2(TEST_USER_ID);

      expect(fetchUserReportAssociationsV2).toHaveBeenCalledWith(TEST_USER_ID);
      expect(createUserReportAssociationV2).toHaveBeenCalledWith({
        userId: TEST_USER_ID,
        reportId: 'report-1',
        countryId: 'us',
        label: 'My report',
      });
    });

    test('given localStorage simulations then creates v2 associations', async () => {
      localStorage.setItem(LS_KEYS.simulations, JSON.stringify([mockSimulation]));

      await migrateV1AssociationsToV2(TEST_USER_ID);

      expect(createUserSimulationAssociationV2).toHaveBeenCalledWith({
        userId: TEST_USER_ID,
        simulationId: 'sim-1',
        countryId: 'us',
        label: 'My simulation',
      });
    });

    test('given localStorage policies then creates v2 associations', async () => {
      localStorage.setItem(LS_KEYS.policies, JSON.stringify([mockPolicy]));

      await migrateV1AssociationsToV2(TEST_USER_ID);

      expect(createUserPolicyAssociationV2).toHaveBeenCalledWith({
        userId: TEST_USER_ID,
        policyId: 'policy-1',
        countryId: 'us',
        label: 'My policy',
      });
    });

    test('given localStorage households then creates v2 associations', async () => {
      localStorage.setItem(LS_KEYS.households, JSON.stringify([mockHousehold]));

      await migrateV1AssociationsToV2(TEST_USER_ID);

      expect(createUserHouseholdAssociationV2).toHaveBeenCalledWith({
        userId: TEST_USER_ID,
        householdId: 'household-1',
        countryId: 'us',
        label: 'My household',
      });
    });

    test('given existing v2 associations then skips duplicates', async () => {
      localStorage.setItem(LS_KEYS.reports, JSON.stringify([mockReport]));
      vi.mocked(fetchUserReportAssociationsV2).mockResolvedValue([
        { ...mockReport, id: 'v2-id', isCreated: true } as any,
      ]);

      await migrateV1AssociationsToV2(TEST_USER_ID);

      expect(createUserReportAssociationV2).not.toHaveBeenCalled();
    });

    test('given API error on one item then returns false and does not set flag', async () => {
      localStorage.setItem(LS_KEYS.reports, JSON.stringify([mockReport]));
      vi.mocked(createUserReportAssociationV2).mockRejectedValue(new Error('API error'));

      const result = await migrateV1AssociationsToV2(TEST_USER_ID);

      expect(result).toBe(false);
      expect(localStorage.getItem(MIGRATION_FLAG_KEY)).toBeNull();
    });

    test('given all items migrated then sets migration flag', async () => {
      localStorage.setItem(LS_KEYS.reports, JSON.stringify([mockReport]));
      localStorage.setItem(LS_KEYS.simulations, JSON.stringify([mockSimulation]));
      localStorage.setItem(LS_KEYS.policies, JSON.stringify([mockPolicy]));
      localStorage.setItem(LS_KEYS.households, JSON.stringify([mockHousehold]));

      const result = await migrateV1AssociationsToV2(TEST_USER_ID);

      expect(result).toBe(true);
      expect(localStorage.getItem(MIGRATION_FLAG_KEY)).toBe('true');
    });

    test('given mixed data across all 4 types then migrates all', async () => {
      localStorage.setItem(LS_KEYS.reports, JSON.stringify([mockReport]));
      localStorage.setItem(LS_KEYS.simulations, JSON.stringify([mockSimulation]));
      localStorage.setItem(LS_KEYS.policies, JSON.stringify([mockPolicy]));
      localStorage.setItem(LS_KEYS.households, JSON.stringify([mockHousehold]));

      await migrateV1AssociationsToV2(TEST_USER_ID);

      expect(createUserReportAssociationV2).toHaveBeenCalledTimes(1);
      expect(createUserSimulationAssociationV2).toHaveBeenCalledTimes(1);
      expect(createUserPolicyAssociationV2).toHaveBeenCalledTimes(1);
      expect(createUserHouseholdAssociationV2).toHaveBeenCalledTimes(1);
    });

    test('given data for different user then does not migrate those items', async () => {
      const otherUserReport = { ...mockReport, userId: 'other-user' };
      localStorage.setItem(LS_KEYS.reports, JSON.stringify([otherUserReport]));

      await migrateV1AssociationsToV2(TEST_USER_ID);

      expect(createUserReportAssociationV2).not.toHaveBeenCalled();
    });

    test('given multiple reports then migrates each one', async () => {
      const report2 = { ...mockReport, id: 'sur-def456', reportId: 'report-2', label: 'Second report' };
      localStorage.setItem(LS_KEYS.reports, JSON.stringify([mockReport, report2]));

      await migrateV1AssociationsToV2(TEST_USER_ID);

      expect(createUserReportAssociationV2).toHaveBeenCalledTimes(2);
    });

    test('given fetch existing fails then returns false', async () => {
      localStorage.setItem(LS_KEYS.reports, JSON.stringify([mockReport]));
      vi.mocked(fetchUserReportAssociationsV2).mockRejectedValue(new Error('Network error'));

      const result = await migrateV1AssociationsToV2(TEST_USER_ID);

      expect(result).toBe(false);
      expect(localStorage.getItem(MIGRATION_FLAG_KEY)).toBeNull();
    });
  });
});
