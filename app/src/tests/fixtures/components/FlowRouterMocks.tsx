import { vi } from 'vitest';
import { Flow } from '@/types/flow';

export const TEST_COUNTRY_ID = 'us';
export const TEST_RETURN_PATH = 'reports';
export const ABSOLUTE_RETURN_PATH = `/us/reports`;

export const TEST_FLOW: Flow = {
  initialFrame: 'TestFrame' as any,
  frames: {
    TestFrame: {
      component: 'TestFrame' as any,
      on: {
        next: 'NextFrame',
      },
    },
    NextFrame: {
      component: 'NextFrame' as any,
      on: {
        back: 'TestFrame',
      },
    },
  },
};

export const mockDispatch = vi.fn();
export const mockSetFlow = vi.fn((payload) => ({ type: 'flow/setFlow', payload }));

export const createMockFlowState = (overrides?: Partial<{ currentFlow: Flow | null }>) => ({
  flow: {
    currentFlow: overrides?.currentFlow ?? null,
    currentFrame: null,
    flowStack: [],
    returnPath: null,
  },
});

export const mockUseParams = vi.fn(() => ({ countryId: TEST_COUNTRY_ID }));
export const mockUseSelector = vi.fn();
