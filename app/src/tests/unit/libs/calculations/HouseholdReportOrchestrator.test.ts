import { QueryClient } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { markReportCompleted, markReportError } from '@/api/report';
import { markSimulationError } from '@/api/simulation';
import { HouseholdReportOrchestrator } from '@/libs/calculations/household/HouseholdReportOrchestrator';
import type { HouseholdReportConfig } from '@/types/calculation/household';
import type { Report } from '@/types/ingredients/Report';

const mocks = vi.hoisted(() => ({
  execute: vi.fn(),
  startProgressTimer: vi.fn(() => 1 as any),
  startSimulation: vi.fn(),
  completeSimulation: vi.fn(),
  failSimulation: vi.fn(),
  cleanup: vi.fn(),
}));

vi.mock('@/api/report');
vi.mock('@/api/simulation');
vi.mock('@/utils/cacheMonitor', () => ({
  cacheMonitor: {
    logInvalidation: vi.fn(),
  },
}));
vi.mock('@/libs/calculations/household/HouseholdSimCalculator', () => ({
  HouseholdSimCalculator: vi.fn().mockImplementation(() => ({
    execute: mocks.execute,
  })),
}));
vi.mock('@/libs/calculations/household/HouseholdProgressCoordinator', () => ({
  HouseholdProgressCoordinator: vi.fn().mockImplementation(() => ({
    startProgressTimer: mocks.startProgressTimer,
    startSimulation: mocks.startSimulation,
    completeSimulation: mocks.completeSimulation,
    failSimulation: mocks.failSimulation,
    cleanup: mocks.cleanup,
  })),
}));

describe('HouseholdReportOrchestrator', () => {
  let queryClient: QueryClient;
  let orchestrator: HouseholdReportOrchestrator;

  beforeEach(() => {
    vi.clearAllMocks();
    (HouseholdReportOrchestrator as any).instance = null;

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    orchestrator = HouseholdReportOrchestrator.getInstance(queryClient);
  });

  afterEach(() => {
    queryClient.clear();
    (HouseholdReportOrchestrator as any).instance = null;
  });

  it('given a failed household simulation then persists report and simulation errors', async () => {
    const error = new Error('404 Not Found');
    mocks.execute.mockRejectedValue(error);
    (markSimulationError as any).mockResolvedValue(undefined);
    (markReportError as any).mockResolvedValue(undefined);

    const report: Report = {
      id: 'report-123',
      countryId: 'us',
      year: '2026',
      apiVersion: null,
      simulationIds: ['sim-1'],
      status: 'pending',
    };

    const config: HouseholdReportConfig = {
      reportId: report.id!,
      countryId: 'us',
      report,
      simulationConfigs: [
        {
          simulationId: 'sim-1',
          populationId: 'household-1',
          policyId: 'policy-1',
        },
      ],
    };

    await orchestrator.startReport(config);

    await vi.waitFor(() => {
      expect(markSimulationError).toHaveBeenCalledWith('us', 'sim-1', '404 Not Found');
      expect(markReportError).toHaveBeenCalledWith(
        'us',
        'report-123',
        expect.objectContaining({
          id: 'report-123',
          status: 'error',
        }),
        '404 Not Found'
      );
    });

    expect(markReportCompleted).not.toHaveBeenCalled();
  });
});
