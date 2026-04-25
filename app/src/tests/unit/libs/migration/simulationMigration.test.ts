import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchSimulationByIdV2 } from '@/api/v2/simulations';
import { logMigrationComparison } from '@/libs/migration/comparisonLogger';
import { sendMigrationLog } from '@/libs/migration/migrationLogTransport';
import {
  compareMappedSimulationRead,
  logSkippedSimulationRead,
  logSkippedUserSimulationAssociationOperation,
  logUserSimulationAssociationComparison,
} from '@/libs/migration/simulationMigration';
import { mockSimulation } from '@/tests/fixtures/adapters/SimulationAdapterMocks';
import { mockSimulation as mockUserSimulation } from '@/tests/fixtures/api/simulationAssociationMocks';

vi.mock('@/api/v2/simulations', () => ({
  fetchSimulationByIdV2: vi.fn(),
}));

vi.mock('@/libs/migration/comparisonLogger', () => ({
  logMigrationComparison: vi.fn(),
}));

vi.mock('@/libs/migration/migrationLogRuntime', () => ({
  logMigrationConsole: vi.fn(),
}));

vi.mock('@/libs/migration/migrationLogTransport', () => ({
  sendMigrationLog: vi.fn(),
}));

describe('simulationMigration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('compareMappedSimulationRead', () => {
    test('given mapped v2 simulation then it logs a simulation comparison', async () => {
      vi.mocked(fetchSimulationByIdV2).mockResolvedValue(
        mockSimulation({
          id: '550e8400-e29b-41d4-a716-446655440000',
          simulationType: 'household',
          source: 'v2_household_api',
          backendStatus: 'completed',
          status: 'complete',
        })
      );

      await compareMappedSimulationRead(
        mockSimulation({
          id: '123',
          simulationType: 'household',
          source: 'v1_api',
          backendStatus: 'complete',
          status: 'complete',
        }),
        '550e8400-e29b-41d4-a716-446655440000'
      );

      expect(fetchSimulationByIdV2).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000');
      expect(logMigrationComparison).toHaveBeenCalledWith(
        'SimulationMigration',
        'READ',
        expect.objectContaining({
          simulationType: 'household',
          policyId: '1',
          populationId: 'household-1',
          status: 'complete',
          backendStatus: 'complete',
        }),
        expect.objectContaining({
          simulationType: 'household',
          policyId: '1',
          populationId: 'household-1',
          status: 'complete',
          backendStatus: 'completed',
        })
      );
    });

    test('given mapped v2 fetch failure then it logs a failed event', async () => {
      vi.mocked(fetchSimulationByIdV2).mockRejectedValue(new Error('404 Not Found'));

      await compareMappedSimulationRead(mockSimulation({ id: '123' }), 'missing-v2-id');

      expect(sendMigrationLog).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'event',
          prefix: 'SimulationMigration',
          operation: 'READ',
          status: 'FAILED',
          message: 'Mapped v2 simulation fetch failed during read comparison',
          metadata: expect.objectContaining({
            v1SimulationId: '123',
            v2SimulationId: 'missing-v2-id',
            error: '404 Not Found',
          }),
        })
      );
    });
  });

  describe('logSkippedSimulationRead', () => {
    test('given skipped simulation read then it emits a skipped event', () => {
      logSkippedSimulationRead('123', 'Read comparison skipped: missing mapped v2 id', {
        countryId: 'us',
      });

      expect(sendMigrationLog).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'event',
          prefix: 'SimulationMigration',
          operation: 'READ',
          status: 'SKIPPED',
          message: 'Read comparison skipped: missing mapped v2 id',
          metadata: expect.objectContaining({
            v1SimulationId: '123',
            countryId: 'us',
          }),
        })
      );
    });
  });

  describe('logUserSimulationAssociationComparison', () => {
    test('given create comparison inputs then it logs a user-simulation comparison', () => {
      logUserSimulationAssociationComparison(
        'CREATE',
        {
          userId: 'anonymous',
          simulationId: '550e8400-e29b-41d4-a716-446655440000',
          countryId: 'us',
          label: 'My Simulation',
        },
        mockUserSimulation({
          id: '650e8400-e29b-41d4-a716-446655440000',
          userId: '750e8400-e29b-41d4-a716-446655440000',
          simulationId: '550e8400-e29b-41d4-a716-446655440000',
          label: 'My Simulation',
        }),
        {
          v2UserId: '750e8400-e29b-41d4-a716-446655440000',
        }
      );

      expect(logMigrationComparison).toHaveBeenCalledWith(
        'UserSimulationMigration',
        'CREATE',
        {
          userId: '750e8400-e29b-41d4-a716-446655440000',
          simulationId: '550e8400-e29b-41d4-a716-446655440000',
          countryId: 'us',
          label: 'My Simulation',
        },
        {
          userId: '750e8400-e29b-41d4-a716-446655440000',
          simulationId: '550e8400-e29b-41d4-a716-446655440000',
          countryId: 'us',
          label: 'My Simulation',
        }
      );
    });
  });

  describe('logSkippedUserSimulationAssociationOperation', () => {
    test('given skipped association operation then it emits a skipped event', () => {
      logSkippedUserSimulationAssociationOperation(
        'LIST',
        'Association list fetch skipped: missing mapped v2 user id',
        {
          userId: 'anonymous',
          countryId: 'us',
        }
      );

      expect(sendMigrationLog).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'event',
          prefix: 'UserSimulationMigration',
          operation: 'LIST',
          status: 'SKIPPED',
          message: 'Association list fetch skipped: missing mapped v2 user id',
          metadata: expect.objectContaining({
            userId: 'anonymous',
            countryId: 'us',
          }),
        })
      );
    });
  });
});
