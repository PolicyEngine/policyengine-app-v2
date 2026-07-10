import { renderHook } from '@test-utils';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { useSimulationProgressDisplay } from '@/hooks/household/useSimulationProgressDisplay';
import { calculationKeys } from '@/libs/queryKeys';
import {
  createSimulationProgressQueryClient,
  createSimulationProgressStatus,
  createSimulationProgressWrapper,
  SIMULATION_PROGRESS_ID,
} from '@/tests/fixtures/hooks/simulationProgressDisplayFixtures';

vi.mock('@/hooks/useSyntheticProgress', () => ({
  useSyntheticProgress: (active: boolean) => ({
    progress: active ? 40 : 0,
    message: active ? 'Running policy simulation...' : '',
  }),
}));

describe('useSimulationProgressDisplay', () => {
  const queryClient = createSimulationProgressQueryClient();
  const wrapper = createSimulationProgressWrapper(queryClient);

  afterEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  test('given calculation is complete but persistence is pending then holds finalizing progress', () => {
    // Given
    queryClient.setQueryData(
      calculationKeys.bySimulationId(SIMULATION_PROGRESS_ID),
      createSimulationProgressStatus('complete')
    );

    // When
    const { result } = renderHook(() => useSimulationProgressDisplay([SIMULATION_PROGRESS_ID]), {
      wrapper,
    });

    // Then
    expect(result.current).toEqual({
      displayProgress: 95,
      hasCalcStatus: true,
      message: 'Finalizing results...',
    });
  });

  test('given calculation is pending then displays synthetic execution progress', () => {
    // Given
    queryClient.setQueryData(
      calculationKeys.bySimulationId(SIMULATION_PROGRESS_ID),
      createSimulationProgressStatus('pending')
    );

    // When
    const { result } = renderHook(() => useSimulationProgressDisplay([SIMULATION_PROGRESS_ID]), {
      wrapper,
    });

    // Then
    expect(result.current).toEqual({
      displayProgress: 40,
      hasCalcStatus: true,
      message: 'Running policy simulation...',
    });
  });
});
