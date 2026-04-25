import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  clearV2AssociationTargetId,
  clearV2Mappings,
  getMappedSimulationId,
  getMappedUserSimulationAssociationId,
  getMappedV2UserId,
  getOrCreateV2UserId,
  getResolvedRegionId,
  getV2AssociationTargetId,
  getV2Id,
  isUuid,
  setMappedSimulationId,
  setMappedUserSimulationAssociationId,
  setResolvedRegionId,
  setV2AssociationTargetId,
  setV2Id,
} from '@/libs/migration/idMapping';

describe('idMapping', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('setV2Id and getV2Id', () => {
    test('given v1 ID then stores and retrieves v2 UUID', () => {
      setV2Id('Policy', 'sup-abc123', '550e8400-e29b-41d4-a716-446655440000');
      expect(getV2Id('Policy', 'sup-abc123')).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    test('given different entity types then stores separately', () => {
      setV2Id('Policy', 'sup-1', 'uuid-policy');
      setV2Id('Household', 'sup-1', 'uuid-household');

      expect(getV2Id('Policy', 'sup-1')).toBe('uuid-policy');
      expect(getV2Id('Household', 'sup-1')).toBe('uuid-household');
    });

    test('given nonexistent mapping then returns null', () => {
      expect(getV2Id('Policy', 'nonexistent')).toBeNull();
    });

    test('given overwrite then returns latest value', () => {
      setV2Id('Policy', 'sup-1', 'uuid-old');
      setV2Id('Policy', 'sup-1', 'uuid-new');

      expect(getV2Id('Policy', 'sup-1')).toBe('uuid-new');
    });

    test('given mixed-case entity type then stores lower-case localStorage key', () => {
      setV2Id('Policy', '42', 'uuid-policy');

      expect(localStorage.getItem('v1v2:policy:42')).toBe('uuid-policy');
      expect(getV2Id('policy', '42')).toBe('uuid-policy');
    });

    test('given association target mapping then stores and retrieves by association and target ids', () => {
      setV2AssociationTargetId('UserHousehold', 'suh-1', 'hh-1', 'uuid-association');

      expect(getV2AssociationTargetId('UserHousehold', 'suh-1', 'hh-1')).toBe('uuid-association');
      expect(localStorage.getItem('v1v2-target:userhousehold:suh-1:hh-1')).toBe('uuid-association');
    });

    test('given cleared association target mapping then returns null', () => {
      setV2AssociationTargetId('UserHousehold', 'suh-1', 'hh-1', 'uuid-association');
      clearV2AssociationTargetId('UserHousehold', 'suh-1', 'hh-1');

      expect(getV2AssociationTargetId('UserHousehold', 'suh-1', 'hh-1')).toBeNull();
    });

    test('given resolved region mapping then stores and retrieves by country and code', () => {
      setResolvedRegionId('us', 'state/ca', 'uuid-region');

      expect(getResolvedRegionId('us', 'state/ca')).toBe('uuid-region');
      expect(localStorage.getItem('v1v2:region:us:state/ca')).toBe('uuid-region');
    });

    test('given mapped simulation ids then stores and retrieves the explicit simulation mapping', () => {
      setMappedSimulationId('123', '550e8400-e29b-41d4-a716-446655440000');

      expect(getMappedSimulationId('123')).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(localStorage.getItem('v1v2:simulation:123')).toBe(
        '550e8400-e29b-41d4-a716-446655440000'
      );
    });

    test('given mapped user-simulation association ids then stores and retrieves the explicit association mapping', () => {
      setMappedUserSimulationAssociationId('sus-local-1', '650e8400-e29b-41d4-a716-446655440000');

      expect(getMappedUserSimulationAssociationId('sus-local-1')).toBe(
        '650e8400-e29b-41d4-a716-446655440000'
      );
      expect(localStorage.getItem('v1v2:usersimulation:sus-local-1')).toBe(
        '650e8400-e29b-41d4-a716-446655440000'
      );
    });
  });

  describe('clearV2Mappings', () => {
    test('given entity type then clears only that type', () => {
      setV2Id('Policy', 'sup-1', 'uuid-p1');
      setV2Id('Household', 'sup-2', 'uuid-h1');
      setV2AssociationTargetId('Policy', 'sup-3', 'target-1', 'uuid-policy-association');
      setResolvedRegionId('us', 'state/ca', 'uuid-region');

      clearV2Mappings('Policy');

      expect(getV2Id('Policy', 'sup-1')).toBeNull();
      expect(getV2Id('Household', 'sup-2')).toBe('uuid-h1');
      expect(getV2AssociationTargetId('Policy', 'sup-3', 'target-1')).toBeNull();
      expect(getResolvedRegionId('us', 'state/ca')).toBe('uuid-region');
    });

    test('given no entity type then clears all mappings', () => {
      setV2Id('Policy', 'sup-1', 'uuid-p1');
      setV2Id('Household', 'sup-2', 'uuid-h1');
      setV2AssociationTargetId('UserHousehold', 'suh-1', 'hh-1', 'uuid-association');

      clearV2Mappings();

      expect(getV2Id('Policy', 'sup-1')).toBeNull();
      expect(getV2Id('Household', 'sup-2')).toBeNull();
      expect(getV2AssociationTargetId('UserHousehold', 'suh-1', 'hh-1')).toBeNull();
    });

    test('given no mappings then does nothing', () => {
      expect(() => clearV2Mappings()).not.toThrow();
    });
  });

  describe('error handling', () => {
    test('given localStorage setItem throws then does not propagate', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceeded');
      });

      expect(() => setV2Id('Policy', 'sup-1', 'uuid-1')).not.toThrow();
    });

    test('given localStorage getItem throws then returns null', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });

      expect(getV2Id('Policy', 'sup-1')).toBeNull();
    });
  });

  describe('v2 user IDs', () => {
    test('given UUID user ID then reuses it for v2', () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';

      expect(getOrCreateV2UserId(userId)).toBe(userId);
      expect(getMappedV2UserId(userId)).toBe(userId);
    });

    test('given non-UUID user ID then creates and stores UUID mapping', () => {
      const randomUUIDSpy = vi
        .spyOn(crypto, 'randomUUID')
        .mockReturnValue('c93a763d-8d9f-4ab8-b04f-2fbba0183f35');

      expect(getOrCreateV2UserId('anonymous')).toBe('c93a763d-8d9f-4ab8-b04f-2fbba0183f35');
      expect(getMappedV2UserId('anonymous')).toBe('c93a763d-8d9f-4ab8-b04f-2fbba0183f35');
      expect(randomUUIDSpy).toHaveBeenCalledOnce();
    });

    test('given ID strings then identifies UUID format', () => {
      expect(isUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isUuid('anonymous')).toBe(false);
    });
  });
});
