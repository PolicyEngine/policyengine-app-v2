import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CalcOrchestratorManager } from '@/libs/calculations/CalcOrchestratorManager';
import { CalcOrchestrator } from '@/libs/calculations/CalcOrchestrator';
import { mockHouseholdCalcConfig, mockSocietyWideCalcConfig } from '@/tests/fixtures/integration/calculationFlowFixtures';
import {
  createTestQueryClient,
  createMockOrchestrator,
  TEST_ERROR_MESSAGE,
} from '@/tests/fixtures/libs/calculations/orchestratorManagerMocks';

// Mock CalcOrchestrator
vi.mock('@/libs/calculations/CalcOrchestrator');
vi.mock('@/libs/calculations/ResultPersister');

describe('CalcOrchestratorManager', () => {
  let manager: CalcOrchestratorManager;
  let queryClient: ReturnType<typeof createTestQueryClient>;
  let mockOrchestrator: any;

  beforeEach(() => {
    // Create fresh query client for each test
    queryClient = createTestQueryClient();

    // Create mock orchestrator
    mockOrchestrator = createMockOrchestrator();

    // Mock CalcOrchestrator constructor
    (CalcOrchestrator as any).mockImplementation(() => mockOrchestrator);

    // Create manager
    manager = new CalcOrchestratorManager(queryClient);

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('given QueryClient then creates manager instance', () => {
      // Given/When
      const newManager = new CalcOrchestratorManager(queryClient);

      // Then
      expect(newManager).toBeDefined();
      expect(newManager.getDebugInfo().activeCount).toBe(0);
    });
  });

  describe('startCalculation', () => {
    it('given new calculation then creates and registers orchestrator', async () => {
      // Given
      const config = mockSocietyWideCalcConfig();

      // When
      await manager.startCalculation(config);

      // Then
      expect(CalcOrchestrator).toHaveBeenCalledWith(
        queryClient,
        expect.anything(), // ResultPersister
        manager // Manager reference
      );
      expect(mockOrchestrator.startCalculation).toHaveBeenCalledWith(config);
      expect(manager.isRunning(config.calcId)).toBe(true);
    });

    it('given duplicate calculation ID then skips creation', async () => {
      // Given
      const config = mockSocietyWideCalcConfig();
      await manager.startCalculation(config);
      vi.clearAllMocks();

      // When
      await manager.startCalculation(config);

      // Then
      expect(CalcOrchestrator).not.toHaveBeenCalled();
      expect(mockOrchestrator.startCalculation).not.toHaveBeenCalled();
    });

    it('given concurrent calls with same ID then only creates one orchestrator', async () => {
      // Given
      const config = mockSocietyWideCalcConfig();

      // When - Start same calculation concurrently
      await Promise.all([
        manager.startCalculation(config),
        manager.startCalculation(config),
        manager.startCalculation(config),
      ]);

      // Then - Only one orchestrator created
      expect(CalcOrchestrator).toHaveBeenCalledTimes(1);
      expect(mockOrchestrator.startCalculation).toHaveBeenCalledTimes(1);
      expect(manager.getDebugInfo().activeCount).toBe(1);
    });

    it('given multiple different calculations then creates separate orchestrators', async () => {
      // Given
      const config1 = mockSocietyWideCalcConfig({ calcId: 'report-1' });
      const config2 = mockHouseholdCalcConfig({ calcId: 'report-2' });

      // When
      await manager.startCalculation(config1);
      await manager.startCalculation(config2);

      // Then
      expect(CalcOrchestrator).toHaveBeenCalledTimes(2);
      expect(manager.isRunning('report-1')).toBe(true);
      expect(manager.isRunning('report-2')).toBe(true);
      expect(manager.getDebugInfo().activeCount).toBe(2);
      expect(manager.getDebugInfo().activeIds).toEqual(['report-1', 'report-2']);
    });

    it('given orchestrator start fails then cleans up and throws', async () => {
      // Given
      const config = mockSocietyWideCalcConfig();
      const error = new Error(TEST_ERROR_MESSAGE);
      mockOrchestrator.startCalculation.mockRejectedValue(error);

      // When/Then
      await expect(manager.startCalculation(config)).rejects.toThrow(TEST_ERROR_MESSAGE);

      // Orchestrator should be cleaned up
      expect(mockOrchestrator.cleanup).toHaveBeenCalled();
      expect(manager.isRunning(config.calcId)).toBe(false);
    });

    it('given household calculation then orchestrator is started', async () => {
      // Given
      const config = mockHouseholdCalcConfig();

      // When
      await manager.startCalculation(config);

      // Then
      expect(mockOrchestrator.startCalculation).toHaveBeenCalledWith(config);
      expect(manager.isRunning(config.calcId)).toBe(true);
    });

    it('given society-wide calculation then orchestrator is started', async () => {
      // Given
      const config = mockSocietyWideCalcConfig();

      // When
      await manager.startCalculation(config);

      // Then
      expect(mockOrchestrator.startCalculation).toHaveBeenCalledWith(config);
      expect(manager.isRunning(config.calcId)).toBe(true);
    });
  });

  describe('isRunning', () => {
    it('given active calculation then returns true', async () => {
      // Given
      const config = mockSocietyWideCalcConfig();
      await manager.startCalculation(config);

      // When
      const result = manager.isRunning(config.calcId);

      // Then
      expect(result).toBe(true);
    });

    it('given no active calculation then returns false', () => {
      // When
      const result = manager.isRunning('nonexistent-id');

      // Then
      expect(result).toBe(false);
    });

    it('given cleaned up calculation then returns false', async () => {
      // Given
      const config = mockSocietyWideCalcConfig();
      await manager.startCalculation(config);
      manager.cleanup(config.calcId);

      // When
      const result = manager.isRunning(config.calcId);

      // Then
      expect(result).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('given active orchestrator then calls cleanup and removes from registry', async () => {
      // Given
      const config = mockSocietyWideCalcConfig();
      await manager.startCalculation(config);

      // When
      manager.cleanup(config.calcId);

      // Then
      expect(mockOrchestrator.cleanup).toHaveBeenCalled();
      expect(manager.isRunning(config.calcId)).toBe(false);
      expect(manager.getDebugInfo().activeCount).toBe(0);
    });

    it('given nonexistent calculation ID then does nothing', () => {
      // When/Then - Should not throw
      expect(() => manager.cleanup('nonexistent-id')).not.toThrow();
    });

    it('given multiple active orchestrators then cleans up only specified one', async () => {
      // Given
      const config1 = mockSocietyWideCalcConfig({ calcId: 'report-1' });
      const config2 = mockSocietyWideCalcConfig({ calcId: 'report-2' });
      await manager.startCalculation(config1);
      await manager.startCalculation(config2);

      // When
      manager.cleanup('report-1');

      // Then
      expect(manager.isRunning('report-1')).toBe(false);
      expect(manager.isRunning('report-2')).toBe(true);
      expect(manager.getDebugInfo().activeCount).toBe(1);
    });

    it('given already cleaned orchestrator then is idempotent', async () => {
      // Given
      const config = mockSocietyWideCalcConfig();
      await manager.startCalculation(config);
      manager.cleanup(config.calcId);

      // When
      manager.cleanup(config.calcId);

      // Then - Should not throw
      expect(manager.isRunning(config.calcId)).toBe(false);
    });
  });

  describe('cleanupAll', () => {
    it('given multiple active orchestrators then cleans up all', async () => {
      // Given
      const config1 = mockSocietyWideCalcConfig({ calcId: 'report-1' });
      const config2 = mockSocietyWideCalcConfig({ calcId: 'report-2' });
      const config3 = mockHouseholdCalcConfig({ calcId: 'report-3' });

      await manager.startCalculation(config1);
      await manager.startCalculation(config2);
      await manager.startCalculation(config3);

      // When
      manager.cleanupAll();

      // Then
      expect(manager.getDebugInfo().activeCount).toBe(0);
      expect(manager.isRunning('report-1')).toBe(false);
      expect(manager.isRunning('report-2')).toBe(false);
      expect(manager.isRunning('report-3')).toBe(false);
    });

    it('given no active orchestrators then does nothing', () => {
      // When/Then - Should not throw
      expect(() => manager.cleanupAll()).not.toThrow();
      expect(manager.getDebugInfo().activeCount).toBe(0);
    });

    it('given active orchestrators then calls cleanup on each', async () => {
      // Given
      const mockOrchestrator1 = createMockOrchestrator();
      const mockOrchestrator2 = createMockOrchestrator();

      (CalcOrchestrator as any)
        .mockImplementationOnce(() => mockOrchestrator1)
        .mockImplementationOnce(() => mockOrchestrator2);

      const config1 = mockSocietyWideCalcConfig({ calcId: 'report-1' });
      const config2 = mockSocietyWideCalcConfig({ calcId: 'report-2' });

      await manager.startCalculation(config1);
      await manager.startCalculation(config2);

      // When
      manager.cleanupAll();

      // Then
      expect(mockOrchestrator1.cleanup).toHaveBeenCalled();
      expect(mockOrchestrator2.cleanup).toHaveBeenCalled();
    });
  });

  describe('getDebugInfo', () => {
    it('given no active orchestrators then returns empty state', () => {
      // When
      const info = manager.getDebugInfo();

      // Then
      expect(info.activeCount).toBe(0);
      expect(info.activeIds).toEqual([]);
    });

    it('given active orchestrators then returns current state', async () => {
      // Given
      const config1 = mockSocietyWideCalcConfig({ calcId: 'report-1' });
      const config2 = mockSocietyWideCalcConfig({ calcId: 'report-2' });
      await manager.startCalculation(config1);
      await manager.startCalculation(config2);

      // When
      const info = manager.getDebugInfo();

      // Then
      expect(info.activeCount).toBe(2);
      expect(info.activeIds).toContain('report-1');
      expect(info.activeIds).toContain('report-2');
    });

    it('given orchestrator cleaned up then reflects updated state', async () => {
      // Given
      const config = mockSocietyWideCalcConfig();
      await manager.startCalculation(config);
      manager.cleanup(config.calcId);

      // When
      const info = manager.getDebugInfo();

      // Then
      expect(info.activeCount).toBe(0);
      expect(info.activeIds).toEqual([]);
    });
  });

  describe('lifecycle integration', () => {
    it('given start then cleanup then start again then creates new orchestrator', async () => {
      // Given
      const config = mockSocietyWideCalcConfig();

      // When - Start, cleanup, start again
      await manager.startCalculation(config);
      manager.cleanup(config.calcId);
      vi.clearAllMocks();
      await manager.startCalculation(config);

      // Then - New orchestrator created
      expect(CalcOrchestrator).toHaveBeenCalledTimes(1);
      expect(manager.isRunning(config.calcId)).toBe(true);
    });

    it('given orchestrator self-cleanup then can start new calculation', async () => {
      // Given
      const config = mockSocietyWideCalcConfig();
      await manager.startCalculation(config);

      // When - Orchestrator cleans itself up (simulating completion)
      manager.cleanup(config.calcId);
      vi.clearAllMocks();

      // Then - Can start new calculation with same ID
      await expect(manager.startCalculation(config)).resolves.not.toThrow();
      expect(manager.isRunning(config.calcId)).toBe(true);
    });
  });
});
