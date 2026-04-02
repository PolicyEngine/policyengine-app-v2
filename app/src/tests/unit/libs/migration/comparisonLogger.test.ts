import { beforeEach, describe, expect, test, vi } from 'vitest';
import { logMigrationComparison } from '@/libs/migration/comparisonLogger';

describe('comparisonLogger', () => {
  let infoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  describe('logMigrationComparison', () => {
    test('given matching fields then logs MATCH summary', () => {
      const v1 = { userId: 'anon', policyId: '42', countryId: 'us' };
      const v2 = { userId: 'anon', policyId: '42', countryId: 'us' };

      logMigrationComparison('PolicyMigration', 'CREATE', v1, v2);

      const calls = infoSpy.mock.calls.map((c) => c[0] as string);

      // Detail lines for each field
      expect(calls.filter((c) => c.includes('[PolicyMigration:Detail]'))).toHaveLength(3);

      // Summary line
      const summary = calls.find((c) => c.includes('[PolicyMigration:MATCH]'));
      expect(summary).toBeDefined();
      expect(summary).toContain('3/3 compared fields match');
    });

    test('given mismatched field then logs DIVERGE summary', () => {
      const v1 = { userId: 'anon', label: 'My reform' };
      const v2 = { userId: 'anon', label: null };

      logMigrationComparison('PolicyMigration', 'CREATE', v1, v2);

      const calls = infoSpy.mock.calls.map((c) => c[0] as string);

      const diverge = calls.find((c) => c.includes('[PolicyMigration:DIVERGE]'));
      expect(diverge).toBeDefined();
      expect(diverge).toContain('1/2 compared fields match');
      expect(diverge).toContain('1 diverge');

      // Mismatched field detail
      const labelDetail = calls.find((c) => c.includes('label:') && c.includes('MISMATCH'));
      expect(labelDetail).toBeDefined();
      expect(labelDetail).toContain('v1="My reform"');
      expect(labelDetail).toContain('v2=null');
    });

    test('given skipFields then marks those as SKIPPED and excludes from comparison count', () => {
      const v1 = { id: 'sup-abc', userId: 'anon' };
      const v2 = { id: '550e8400-uuid', userId: 'anon' };

      logMigrationComparison('PolicyMigration', 'CREATE', v1, v2, {
        skipFields: ['id'],
      });

      const calls = infoSpy.mock.calls.map((c) => c[0] as string);

      const idDetail = calls.find((c) => c.includes('id:') && c.includes('SKIPPED'));
      expect(idDetail).toBeDefined();

      // Summary only counts non-skipped fields
      const summary = calls.find((c) => c.includes('[PolicyMigration:MATCH]'));
      expect(summary).toBeDefined();
      expect(summary).toContain('1/1 compared fields match');
    });

    test('given field only in v1 then logs it with v2=undefined', () => {
      const v1 = { extra: 'v1-only', shared: 'same' };
      const v2 = { shared: 'same' };

      logMigrationComparison('TestMigration', 'UPDATE', v1, v2);

      const calls = infoSpy.mock.calls.map((c) => c[0] as string);

      const extraDetail = calls.find((c) => c.includes('extra:'));
      expect(extraDetail).toContain('v2=undefined');
      expect(extraDetail).toContain('MISMATCH');
    });

    test('given field only in v2 then logs it with v1=undefined', () => {
      const v1 = { shared: 'same' };
      const v2 = { shared: 'same', extra: 'v2-only' };

      logMigrationComparison('TestMigration', 'CREATE', v1, v2);

      const calls = infoSpy.mock.calls.map((c) => c[0] as string);

      const extraDetail = calls.find((c) => c.includes('extra:'));
      expect(extraDetail).toContain('v1=undefined');
      expect(extraDetail).toContain('MISMATCH');
    });

    test('given all fields skipped then logs MATCH with 0/0', () => {
      const v1 = { id: 'sup-1', createdAt: '2026-01-01' };
      const v2 = { id: 'uuid-1', createdAt: '2026-01-02' };

      logMigrationComparison('PolicyMigration', 'CREATE', v1, v2, {
        skipFields: ['id', 'createdAt'],
      });

      const calls = infoSpy.mock.calls.map((c) => c[0] as string);
      const summary = calls.find((c) => c.includes('[PolicyMigration:MATCH]'));
      expect(summary).toContain('0/0');
    });

    test('given object values then compares via JSON.stringify', () => {
      const v1 = { data: { a: 1, b: 2 } };
      const v2 = { data: { a: 1, b: 2 } };

      logMigrationComparison('TestMigration', 'CREATE', v1, v2);

      const calls = infoSpy.mock.calls.map((c) => c[0] as string);
      const summary = calls.find((c) => c.includes('[TestMigration:MATCH]'));
      expect(summary).toBeDefined();
    });

    test('given different prefixes then prefix appears in all log lines', () => {
      const v1 = { x: 1 };
      const v2 = { x: 1 };

      logMigrationComparison('HouseholdMigration', 'CREATE', v1, v2);

      const calls = infoSpy.mock.calls.map((c) => c[0] as string);
      for (const call of calls) {
        expect(call).toContain('HouseholdMigration');
      }
    });

    test('given operation name then it appears in all log lines', () => {
      const v1 = { x: 1 };
      const v2 = { x: 1 };

      logMigrationComparison('PolicyMigration', 'UPDATE', v1, v2);

      const calls = infoSpy.mock.calls.map((c) => c[0] as string);
      for (const call of calls) {
        expect(call).toContain('UPDATE');
      }
    });
  });
});
