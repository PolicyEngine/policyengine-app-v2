import { vi } from 'vitest';

// Mock handleCancel function that can be spied on
export const mockHandleCancel = vi.fn();

// Mock implementation of useCancelFlow
export const mockUseCancelFlow = vi.fn(() => ({
  handleCancel: mockHandleCancel,
}));

// Setup function to mock the module
export const setupUseCancelFlowMock = () => {
  vi.mock('@/hooks/useCancelFlow', () => ({
    useCancelFlow: mockUseCancelFlow,
  }));
};

// Reset function for beforeEach
export const resetUseCancelFlowMock = () => {
  mockHandleCancel.mockClear();
  mockUseCancelFlow.mockClear();
};
